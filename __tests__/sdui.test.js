import { renderableComponents, resolveBinding, buildLocalContext, isStale, DEFAULT_LAYOUT, todayString } from '../src/logic/sdui';

const registry = { alert_card: true, stats_row: true, schedule_list: true, standings_card: true, action_row: true };

describe('renderableComponents', () => {
  it('orders components by priority', () => {
    const schema = { components: [
      { id: 's', type: 'stats_row', priority: 50 },
      { id: 'a', type: 'alert_card', priority: 10 },
      { id: 'l', type: 'schedule_list', priority: 15 },
    ] };
    expect(renderableComponents(schema, registry).map((c) => c.id)).toEqual(['a', 'l', 's']);
  });

  it('skips unknown component types instead of crashing (graceful degradation)', () => {
    const schema = { components: [{ type: 'hologram_widget', priority: 1 }, { type: 'stats_row', priority: 2 }, null, { priority: 3 }] };
    expect(renderableComponents(schema, registry).map((c) => c.type)).toEqual(['stats_row']);
  });

  it('handles a missing or malformed schema', () => {
    expect(renderableComponents(null, registry)).toEqual([]);
    expect(renderableComponents({ components: 'nope' }, registry)).toEqual([]);
  });

  it('can always render the bundled default layout', () => {
    expect(renderableComponents(DEFAULT_LAYOUT, registry)).toHaveLength(DEFAULT_LAYOUT.components.length);
  });
});

describe('buildLocalContext + resolveBinding', () => {
  const now = new Date(2026, 10, 24, 10, 0);
  const today = todayString(now);
  const data = {
    events: [
      { uuid: 'e2', name: '200m', event_date: today, start_time: '11:00', status: 'upcoming' },
      { uuid: 'e1', name: '100m', event_date: today, start_time: '09:00', status: 'running', _pending: true },
      { uuid: 'e3', name: 'Tomorrow', event_date: '2099-01-01', start_time: '09:00', status: 'upcoming' },
    ],
    athletes: [{ uuid: 'a1', house: 'Red' }, { uuid: 'a2', house: 'Blue' }],
    results: [{ uuid: 'r1', event_uuid: 'e1', athlete_uuid: 'a2', placement: 1 }],
    delays: [{ event_uuid: 'e1', delay_minutes: 5 }, { event_uuid: 'e1', delay_minutes: 7 }],
    pendingCount: 3,
  };
  const ctx = buildLocalContext(data, now);

  it("lists today's events in start order with summed local delays", () => {
    expect(ctx['events.today'].map((e) => e.uuid)).toEqual(['e1', 'e2']);
    expect(ctx['events.today'][0]).toMatchObject({ delay_minutes: 12, pending: true });
  });

  it('counts local statistics including the sync queue', () => {
    expect(ctx['stats.summary']).toEqual({ 'events.count': 3, 'athletes.count': 2, 'results.entered': 1, 'sync.pending': 3 });
  });

  it('prefers local data (includes offline edits) over the cached snapshot', () => {
    const c = { data: { bind: 'stats.summary', value: { 'events.count': 99 } } };
    expect(resolveBinding(c, ctx)['events.count']).toBe(3);
  });

  it('keeps larger server-inferred delays when merging the schedule', () => {
    const c = { data: { bind: 'events.today', value: [{ uuid: 'e2', delay_minutes: 20 }] } };
    const resolved = resolveBinding(c, ctx);
    expect(resolved.find((e) => e.uuid === 'e2').delay_minutes).toBe(20);
    expect(resolved.find((e) => e.uuid === 'e1').delay_minutes).toBe(12);
  });

  it('falls back to the server snapshot for bindings the device cannot compute', () => {
    const c = { data: { bind: 'analysis.findings', value: [{ type: 'venue_conflict' }] } };
    expect(resolveBinding(c, ctx)).toEqual([{ type: 'venue_conflict' }]);
  });

  it('returns undefined for components without data', () => {
    expect(resolveBinding({ type: 'action_row' }, ctx)).toBeUndefined();
  });
});

describe('isStale', () => {
  it('uses the layout TTL', () => {
    const fetched = new Date('2026-11-24T10:00:00Z');
    const layout = { fetched_at: fetched.toISOString(), cache: { ttl_minutes: 30 } };
    expect(isStale(layout, fetched.getTime() + 10 * 60000)).toBe(false);
    expect(isStale(layout, fetched.getTime() + 31 * 60000)).toBe(true);
    expect(isStale(null)).toBe(true);
  });
});
