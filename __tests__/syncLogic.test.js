import {
  buildMutation, mergeSnapshot, interpretResponse, backoffDelay, pendingUuids, pickSyncFields, summariseErrors,
} from '../src/logic/syncLogic';
import { uuidv4, isUuid } from '../src/logic/uuid';

describe('uuidv4', () => {
  it('generates valid, unique version-4 uuids', () => {
    const ids = new Set(Array.from({ length: 500 }, uuidv4));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(isUuid(id)).toBe(true);
  });
});

describe('buildMutation', () => {
  const event = { uuid: uuidv4(), name: '100m', event_date: '2026-11-24', start_time: '09:00', status: 'upcoming', _pending: true, _server_updated_at: '2026-11-24T08:00:00.000Z', id: 7 };

  it('sends only syncable fields on create', () => {
    const m = buildMutation('event', 'create', event, {}, new Date('2026-11-24T09:00:00Z'));
    expect(m).toMatchObject({ entity: 'event', op: 'create', uuid: event.uuid, status: 'pending', client_updated_at: '2026-11-24T09:00:00.000Z' });
    expect(m.data).toEqual({ name: '100m', event_date: '2026-11-24', start_time: '09:00', status: 'upcoming' });
    expect(m.data).not.toHaveProperty('_pending');
    expect(m.data).not.toHaveProperty('id');
    expect(isUuid(m.id)).toBe(true);
  });

  it('sends only the changed fields on update and carries the base version', () => {
    const m = buildMutation('event', 'update', event, { status: 'running' });
    expect(m.data).toEqual({ status: 'running' });
    expect(m.base_updated_at).toBe('2026-11-24T08:00:00.000Z');
  });

  it('sends no data on delete', () => {
    expect(buildMutation('athlete', 'delete', { uuid: uuidv4() }).data).toEqual({});
  });

  it('strips unknown fields for each entity', () => {
    expect(pickSyncFields('result', { athlete_uuid: 'a', placement: 1, hacked: true })).toEqual({ athlete_uuid: 'a', placement: 1 });
  });
});

describe('mergeSnapshot', () => {
  const server = [
    { uuid: 'a', name: 'Server A', updated_at: 't1' },
    { uuid: 'b', name: 'Server B', updated_at: 't2' },
  ];

  it('adopts server records and records their version', () => {
    const merged = mergeSnapshot([], server, []);
    expect(merged.find((r) => r.uuid === 'a')).toMatchObject({ name: 'Server A', _server_updated_at: 't1', _pending: false });
  });

  it('never overwrites records with unsynced local changes', () => {
    const local = [{ uuid: 'a', name: 'Local edit', _pending: true }];
    expect(mergeSnapshot(local, server, ['a']).find((r) => r.uuid === 'a').name).toBe('Local edit');
  });

  it('keeps records created offline that the server has not seen yet', () => {
    const local = [{ uuid: 'new', name: 'Offline only', _pending: true }];
    expect(mergeSnapshot(local, server, ['new']).map((r) => r.uuid).sort()).toEqual(['a', 'b', 'new']);
  });

  it('drops synced local records that were deleted on the server', () => {
    const local = [{ uuid: 'gone', name: 'Deleted elsewhere' }];
    expect(mergeSnapshot(local, server, []).map((r) => r.uuid)).not.toContain('gone');
  });
});

describe('interpretResponse', () => {
  const m = { id: 'm1', uuid: 'r1' };

  it('adopts the server record when applied', () => {
    expect(interpretResponse(m, { status: 'applied', record: { uuid: 'r1' } })).toMatchObject({ action: 'adopt', removeLocalUuid: null, conflict: null });
  });

  it('flags a client-wins conflict', () => {
    expect(interpretResponse(m, { status: 'applied', resolution: 'client_wins', record: { uuid: 'r1' } }).conflict).toBe('client_wins');
  });

  it('adopts the server version when the server wins', () => {
    const d = interpretResponse(m, { status: 'conflict', resolution: 'server_wins', record: { uuid: 'r1', name: 'Server' } });
    expect(d).toMatchObject({ action: 'adopt', conflict: 'server_wins' });
    expect(d.record.name).toBe('Server');
  });

  it('remaps the local uuid when the server merged into another record', () => {
    expect(interpretResponse(m, { status: 'applied', record: { uuid: 'server-uuid' } }).removeLocalUuid).toBe('r1');
  });

  it('removes the local record for applied deletes', () => {
    expect(interpretResponse(m, { status: 'applied', deleted: true })).toEqual({ action: 'remove', uuid: 'r1' });
  });

  it('fails with a readable reason when rejected', () => {
    expect(interpretResponse(m, { status: 'rejected', errors: { placement: ['Placement taken'] } })).toEqual({ action: 'fail', error: 'Placement taken' });
  });

  it('retries when no response was received for the mutation', () => {
    expect(interpretResponse(m, undefined)).toEqual({ action: 'retry' });
  });
});

describe('helpers', () => {
  it('backs off exponentially up to a minute', () => {
    expect(backoffDelay(1)).toBe(2000);
    expect(backoffDelay(3)).toBe(8000);
    expect(backoffDelay(20)).toBe(60000);
  });

  it('lists uuids with pending or failed work', () => {
    const q = [{ uuid: 'a', status: 'pending' }, { uuid: 'b', status: 'failed' }, { uuid: 'c', status: 'synced' }];
    expect(pendingUuids(q)).toEqual(['a', 'b']);
  });

  it('summarises validation errors', () => {
    expect(summariseErrors({ a: ['One'], b: ['Two'] })).toBe('One Two');
    expect(summariseErrors(null)).toBe('Rejected by server');
  });
});
