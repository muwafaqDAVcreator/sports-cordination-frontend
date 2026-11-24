// Pure decision logic of the client-side sync engine. Kept free of storage and
// network code so every rule can be unit tested in isolation.

import { uuidv4 } from './uuid';

export const ENTITY_TABLES = { event: 'events', athlete: 'athletes', result: 'results', delay: 'delays' };

/** Fields of each entity that are sent to the server (local-only keys are stripped). */
const SYNC_FIELDS = {
  event: ['name', 'discipline', 'event_date', 'start_time', 'end_time', 'actual_start_time', 'venue', 'officials_required', 'officials_assigned', 'status'],
  athlete: ['event_uuid', 'name', 'bib_number', 'age', 'house'],
  result: ['event_uuid', 'athlete_uuid', 'placement', 'time', 'wind_speed', 'notes'],
  delay: ['event_uuid', 'delay_minutes', 'reason'],
};

export function pickSyncFields(entity, data) {
  const out = {};
  for (const key of SYNC_FIELDS[entity]) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

/**
 * Build one append-only queue entry. `base_updated_at` is the server version
 * the device last saw; the server uses it to detect concurrent edits.
 */
export function buildMutation(entity, op, record, changes = {}, now = new Date()) {
  return {
    id: uuidv4(),
    entity,
    op,
    uuid: record.uuid,
    data: op === 'delete' ? {} : pickSyncFields(entity, op === 'create' ? record : changes),
    client_updated_at: now.toISOString(),
    base_updated_at: record._server_updated_at || null,
    status: 'pending',
    attempts: 0,
    error: null,
  };
}

/**
 * Merge a server snapshot into the local mirror.
 *
 * - Server records replace local ones (the server is the reconciled truth)...
 * - ...except records with unsynced local changes, which are kept as-is so a
 *   pull can never overwrite work that has not been uploaded yet.
 * - Local records missing from the snapshot are dropped (deleted elsewhere)
 *   unless they are pending (created offline, not uploaded yet).
 */
export function mergeSnapshot(localRecords, serverRecords, pendingUuids) {
  const pending = new Set(pendingUuids);
  const merged = {};

  for (const s of serverRecords) {
    merged[s.uuid] = { ...s, _server_updated_at: s.updated_at, _pending: false, _syncError: null };
  }
  for (const l of localRecords) {
    if (pending.has(l.uuid)) merged[l.uuid] = l;
  }
  return Object.values(merged);
}

/**
 * Decide what the device must do with one server response.
 * Returns { action, record?, removeLocalUuid?, error? }.
 */
export function interpretResponse(mutation, response) {
  if (!response) return { action: 'retry' };

  switch (response.status) {
    case 'applied':
      if (response.deleted) return { action: 'remove', uuid: mutation.uuid };
      return {
        action: 'adopt',
        record: response.record,
        // The server merged this into an existing record with another uuid
        // (e.g. two devices recorded the same athlete's result offline).
        removeLocalUuid: response.record && response.record.uuid !== mutation.uuid ? mutation.uuid : null,
        conflict: response.resolution === 'client_wins' ? 'client_wins' : null,
      };
    case 'conflict':
      return {
        action: 'adopt',
        record: response.record,
        removeLocalUuid: response.record && response.record.uuid !== mutation.uuid ? mutation.uuid : null,
        conflict: 'server_wins',
      };
    case 'rejected':
      return { action: 'fail', error: summariseErrors(response.errors) };
    default:
      return { action: 'retry' };
  }
}

export function summariseErrors(errors) {
  if (!errors) return 'Rejected by server';
  const messages = Object.values(errors).flat();
  return messages.length ? messages.join(' ') : 'Rejected by server';
}

/** Exponential backoff for retrying after network failures: 2s, 4s, 8s ... max 60s. */
export function backoffDelay(attempts) {
  return Math.min(60000, 1000 * 2 ** Math.max(1, attempts));
}

/** Uuids that still have unsynced (pending or failed) mutations. */
export function pendingUuids(queue) {
  return queue.filter((m) => m.status === 'pending' || m.status === 'failed').map((m) => m.uuid);
}
