// Client-side synchronization engine (FR5, FR6, FR9).
//
//   push  - uploads pending mutations from the append-only queue in order,
//           in batches, and applies each per-mutation server verdict
//           (applied / conflict / rejected). Network failure leaves the queue
//           untouched for a later retry, so nothing is ever lost.
//   pull  - downloads the server snapshot and merges it into the local
//           mirror without overwriting unsynced local work.
//   layout- fetches the role's AI-optimised SDUI dashboard and caches it.
//
// A single sync runs at a time; concurrent callers share the running promise.

import api from './api';
import * as db from './localDb';
import { SDUI_SCHEMA_VERSION, SYNC_BATCH_SIZE } from '../config';
import { ENTITY_TABLES, interpretResponse, mergeSnapshot, pendingUuids } from '../logic/syncLogic';

let running = null;

export function sync(options = {}) {
  if (!running) {
    running = doSync(options).finally(() => { running = null; });
  }
  return running;
}

export const isSyncing = () => running !== null;

async function doSync({ role = 'coordinator', pull: shouldPull = true, layout = true } = {}) {
  const summary = { uploaded: 0, applied: 0, conflicts: 0, rejected: 0, pulled: false, layout: false, error: null };

  try {
    await push(summary);
    if (shouldPull) {
      await pull();
      summary.pulled = true;
    }
    if (layout) {
      await fetchLayout(role);
      summary.layout = true;
    }
    await db.setMeta('last_sync_at', new Date().toISOString());
  } catch (err) {
    summary.error = describeError(err);
  }

  await db.setMeta('last_sync_result', { ...summary, at: new Date().toISOString() });
  return summary;
}

function describeError(err) {
  if (err?.response?.status === 401) return 'Session expired - please log in again';
  if (!err?.response) return 'Server unreachable - changes are kept on this device';
  return err.response?.data?.message || err.message || 'Sync failed';
}

/** Mutations for the next batch: in queue order, at most one per record. */
function nextBatch(queue) {
  const batch = [];
  const seen = new Set();
  for (const m of queue) {
    if (m.status !== 'pending') continue;
    if (seen.has(m.uuid)) continue; // later edits go in the next round with a fresh base version
    seen.add(m.uuid);
    batch.push(m);
    if (batch.length >= SYNC_BATCH_SIZE) break;
  }
  return batch;
}

async function push(summary) {
  for (let round = 0; round < 50; round++) {
    const batch = nextBatch(await db.getQueue());
    if (!batch.length) return;

    let results;
    try {
      const res = await api.post('/sync/upload', {
        mutations: batch.map(({ id, entity, op, uuid, data, client_updated_at, base_updated_at }) =>
          ({ id, entity, op, uuid, data, client_updated_at, base_updated_at })),
      });
      results = res.data.data.results;
    } catch (err) {
      for (const m of batch) await db.updateMutation(m.id, { attempts: (m.attempts || 0) + 1 });
      throw err;
    }

    summary.uploaded += batch.length;
    const byId = {};
    for (const r of results) if (r && r.id) byId[r.id] = r;

    let progressed = false;
    for (const m of batch) {
      const decision = interpretResponse(m, byId[m.id]);
      const table = ENTITY_TABLES[m.entity];

      if (decision.action === 'retry') continue;
      progressed = true;

      if (decision.action === 'remove') {
        await db.remove(table, m.uuid);
        await db.removeMutation(m.id);
        summary.applied += 1;
      } else if (decision.action === 'adopt') {
        await adopt(table, m, decision);
        summary.applied += decision.conflict === 'server_wins' ? 0 : 1;
        if (decision.conflict) {
          summary.conflicts += 1;
          await recordConflict(m, decision);
        }
      } else if (decision.action === 'fail') {
        await db.updateMutation(m.id, { status: 'failed', error: decision.error });
        await flagRecord(table, m.uuid, decision.error);
        summary.rejected += 1;
      }
    }
    if (!progressed) return;
  }
}

async function adopt(table, m, { record, removeLocalUuid }) {
  if (removeLocalUuid) {
    await db.remove(table, removeLocalUuid);
    await db.rewriteQueuedUuid(removeLocalUuid, record.uuid);
  }
  await db.removeMutation(m.id);

  // Later queued edits to this record now build on the version just written.
  const queue = await db.getQueue();
  const stillQueued = queue.filter((q) => q.uuid === record.uuid && q.status === 'pending');
  for (const q of stillQueued) await db.updateMutation(q.id, { base_updated_at: record.updated_at });

  const local = (await db.getAll(table)).find((r) => r.uuid === record.uuid);
  if (stillQueued.length && local) {
    // Keep the newer local values on screen; only learn the server identity/version.
    await db.put(table, { ...local, id: record.id, _server_updated_at: record.updated_at });
  } else {
    await db.put(table, { ...record, _server_updated_at: record.updated_at, _pending: false, _syncError: null });
  }
}

async function flagRecord(table, uuid, error) {
  const local = (await db.getAll(table)).find((r) => r.uuid === uuid);
  if (local) await db.put(table, { ...local, _syncError: error });
}

async function recordConflict(m, decision) {
  const log = await db.getMeta('conflict_log', []);
  const label = decision.record?.name || decision.record?.event_uuid || m.uuid;
  log.unshift({
    id: m.id,
    entity: m.entity,
    uuid: decision.record?.uuid || m.uuid,
    label,
    resolution: decision.conflict,
    local_change: m.data,
    at: new Date().toISOString(),
  });
  await db.setMeta('conflict_log', log.slice(0, 50));
}

export async function pull() {
  const res = await api.get('/sync/download');
  const snapshot = res.data.data;
  const pending = pendingUuids(await db.getQueue());

  for (const table of ['events', 'athletes', 'results', 'delays']) {
    const local = await db.getAll(table);
    await db.replaceTable(table, mergeSnapshot(local, snapshot[table] || [], pending));
  }
  await db.setMeta('server_time', snapshot.server_time);
}

export async function fetchLayout(role) {
  const res = await api.get(`/dashboards/${role}`, { params: { schema_version: SDUI_SCHEMA_VERSION } });
  await db.saveLayout(role, res.data.data);
}

/** Drop a failed mutation the coordinator chose to discard, then re-pull to restore server truth. */
export async function discardMutation(id) {
  await db.removeMutation(id);
}

/** Retry a failed mutation (e.g. after the coordinator fixed the conflicting data). */
export async function retryMutation(id) {
  await db.updateMutation(id, { status: 'pending', error: null });
}
