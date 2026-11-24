// SDUI contract helpers: ordering, registry filtering, and binding resolution
// against local data (so a cached layout shows live local values offline).

import { overallMedalTable } from './standings';

export const todayString = (now = new Date()) => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Components the client will render: sorted by priority, unknown types
 * dropped (graceful degradation - never crash on a newer server schema).
 */
export function renderableComponents(schema, registry) {
  if (!schema || !Array.isArray(schema.components)) return [];
  return schema.components
    .filter((c) => c && typeof c.type === 'string' && registry[c.type])
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
}

/** A cached layout older than its TTL is still rendered, but flagged stale. */
export function isStale(layout, now = Date.now()) {
  if (!layout || !layout.fetched_at) return true;
  const ttl = (layout.cache && layout.cache.ttl_minutes) || 30;
  return now - new Date(layout.fetched_at).getTime() > ttl * 60000;
}

/** Build the local context bindings resolve against. */
export function buildLocalContext({ events = [], athletes = [], results = [], delays = [], pendingCount = 0 }, now = new Date()) {
  const today = todayString(now);
  const delayByEvent = {};
  for (const d of delays) delayByEvent[d.event_uuid] = (delayByEvent[d.event_uuid] || 0) + (d.delay_minutes || 0);

  const todayEvents = events
    .filter((e) => e.event_date === today)
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
    .map((e) => ({
      uuid: e.uuid,
      name: e.name,
      venue: e.venue,
      start_time: e.start_time,
      status: e.status,
      delay_minutes: delayByEvent[e.uuid] || 0,
      pending: !!e._pending,
    }));

  return {
    'events.today': todayEvents,
    'stats.summary': {
      'events.count': events.length,
      'athletes.count': athletes.length,
      'results.entered': results.length,
      'sync.pending': pendingCount,
    },
    'standings.overall': overallMedalTable(results, athletes),
  };
}

/**
 * Resolve a component's data. Local values win when the device has data for
 * the binding (they include offline edits); otherwise the server snapshot is
 * used. Server-computed delay minutes are kept when larger, because the
 * server also infers delays from the clock.
 */
export function resolveBinding(component, context) {
  const data = component.data;
  if (!data || !data.bind) return undefined;
  const snapshot = data.value;
  const local = context ? context[data.bind] : undefined;

  if (local === undefined) return snapshot;

  if (data.bind === 'events.today' && Array.isArray(snapshot)) {
    const serverDelay = {};
    for (const e of snapshot) serverDelay[e.uuid] = e.delay_minutes || 0;
    return local.map((e) => ({ ...e, delay_minutes: Math.max(e.delay_minutes, serverDelay[e.uuid] || 0) }));
  }
  if (data.bind === 'standings.overall' && Array.isArray(local) && local.length === 0) return snapshot;

  return local;
}

/** Layout used before the device has ever fetched one (first launch offline). */
export const DEFAULT_LAYOUT = {
  schema_version: 1,
  role: 'coordinator',
  reason: 'default',
  generated_at: null,
  components: [
    { id: 'stats', type: 'stats_row', priority: 5, props: { items: [
      { key: 'events.count', label: 'Events' },
      { key: 'athletes.count', label: 'Athletes' },
      { key: 'results.entered', label: 'Results' },
      { key: 'sync.pending', label: 'Pending sync' },
    ] }, data: { bind: 'stats.summary', value: null } },
    { id: 'schedule', type: 'schedule_list', priority: 40, props: { title: "Today's Events" }, data: { bind: 'events.today', value: [] } },
    { id: 'standings', type: 'standings_card', priority: 70, props: { title: 'Medal Table', limit: 4 }, data: { bind: 'standings.overall', value: [] } },
    { id: 'actions', type: 'action_row', priority: 90, props: { actions: ['new_event', 'view_events', 'sync_now'] } },
  ],
  cache: { ttl_minutes: 30, offline_render: true },
};
