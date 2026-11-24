// On-device SQLite database: the system of record on the phone.
//
// Domain tables mirror the server entities (stored as JSON documents keyed by
// uuid, with the parent uuid indexed for child lookups). Two infrastructure
// tables implement the offline-first machinery described in the interim
// report (Table 16): the append-only `sync_queue` and the `cached_layouts`
// SDUI layout cache. The web build uses localDb.web.js with the same API.

import * as SQLite from 'expo-sqlite';

const DOMAIN_TABLES = ['events', 'athletes', 'results', 'delays'];

let dbPromise = null;

function db() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const conn = await SQLite.openDatabaseAsync('sports_coordinator.db');
      await conn.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS events   (uuid TEXT PRIMARY KEY NOT NULL, parent_uuid TEXT, doc TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS athletes (uuid TEXT PRIMARY KEY NOT NULL, parent_uuid TEXT, doc TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS results  (uuid TEXT PRIMARY KEY NOT NULL, parent_uuid TEXT, doc TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS delays   (uuid TEXT PRIMARY KEY NOT NULL, parent_uuid TEXT, doc TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_athletes_parent ON athletes(parent_uuid);
        CREATE INDEX IF NOT EXISTS idx_results_parent  ON results(parent_uuid);
        CREATE INDEX IF NOT EXISTS idx_delays_parent   ON delays(parent_uuid);

        CREATE TABLE IF NOT EXISTS sync_queue (
          seq INTEGER PRIMARY KEY AUTOINCREMENT,
          id TEXT UNIQUE NOT NULL,
          entity TEXT NOT NULL,
          op TEXT NOT NULL,
          uuid TEXT NOT NULL,
          payload TEXT NOT NULL,
          client_updated_at TEXT NOT NULL,
          base_updated_at TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_queue_status ON sync_queue(status, seq);

        CREATE TABLE IF NOT EXISTS cached_layouts (
          role TEXT PRIMARY KEY NOT NULL,
          schema_version INTEGER NOT NULL,
          layout TEXT NOT NULL,
          fetched_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT);
      `);
      return conn;
    })();
  }
  return dbPromise;
}

const parentOf = (record) => record.event_uuid || null;

function assertTable(table) {
  if (!DOMAIN_TABLES.includes(table)) throw new Error(`Unknown table ${table}`);
}

export async function init() {
  await db();
}

export async function getAll(table) {
  assertTable(table);
  const rows = await (await db()).getAllAsync(`SELECT doc FROM ${table}`);
  return rows.map((r) => JSON.parse(r.doc));
}

export async function put(table, record) {
  assertTable(table);
  await (await db()).runAsync(
    `INSERT OR REPLACE INTO ${table} (uuid, parent_uuid, doc) VALUES (?, ?, ?)`,
    [record.uuid, parentOf(record), JSON.stringify(record)],
  );
}

export async function remove(table, uuid) {
  assertTable(table);
  await (await db()).runAsync(`DELETE FROM ${table} WHERE uuid = ?`, [uuid]);
}

export async function replaceTable(table, records) {
  assertTable(table);
  const conn = await db();
  await conn.withTransactionAsync(async () => {
    await conn.runAsync(`DELETE FROM ${table}`);
    for (const r of records) {
      await conn.runAsync(`INSERT INTO ${table} (uuid, parent_uuid, doc) VALUES (?, ?, ?)`, [r.uuid, parentOf(r), JSON.stringify(r)]);
    }
  });
}

// ---------------------------------------------------------------- sync queue

const rowToMutation = (r) => ({
  seq: r.seq,
  id: r.id,
  entity: r.entity,
  op: r.op,
  uuid: r.uuid,
  data: JSON.parse(r.payload),
  client_updated_at: r.client_updated_at,
  base_updated_at: r.base_updated_at,
  status: r.status,
  attempts: r.attempts,
  error: r.error,
});

export async function addMutation(m) {
  await (await db()).runAsync(
    `INSERT INTO sync_queue (id, entity, op, uuid, payload, client_updated_at, base_updated_at, status, attempts, error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [m.id, m.entity, m.op, m.uuid, JSON.stringify(m.data || {}), m.client_updated_at, m.base_updated_at, m.status || 'pending', m.attempts || 0, m.error],
  );
}

export async function getQueue() {
  const rows = await (await db()).getAllAsync('SELECT * FROM sync_queue ORDER BY seq');
  return rows.map(rowToMutation);
}

export async function updateMutation(id, patch) {
  const fields = [];
  const values = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k === 'data' ? 'payload' : k} = ?`);
    values.push(k === 'data' ? JSON.stringify(v) : v);
  }
  if (!fields.length) return;
  await (await db()).runAsync(`UPDATE sync_queue SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
}

export async function removeMutation(id) {
  await (await db()).runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

/** After the server merges a record into one with another uuid, repoint queued work. */
export async function rewriteQueuedUuid(oldUuid, newUuid) {
  await (await db()).runAsync('UPDATE sync_queue SET uuid = ? WHERE uuid = ?', [newUuid, oldUuid]);
}

// ---------------------------------------------------------------- layouts & meta

export async function getLayout(role) {
  const row = await (await db()).getFirstAsync('SELECT layout, fetched_at FROM cached_layouts WHERE role = ?', [role]);
  return row ? { ...JSON.parse(row.layout), fetched_at: row.fetched_at } : null;
}

export async function saveLayout(role, layout, fetchedAt = new Date().toISOString()) {
  await (await db()).runAsync(
    'INSERT OR REPLACE INTO cached_layouts (role, schema_version, layout, fetched_at) VALUES (?, ?, ?, ?)',
    [role, layout.schema_version || 1, JSON.stringify(layout), fetchedAt],
  );
}

export async function getMeta(key, fallback = null) {
  const row = await (await db()).getFirstAsync('SELECT value FROM meta WHERE key = ?', [key]);
  return row ? JSON.parse(row.value) : fallback;
}

export async function setMeta(key, value) {
  await (await db()).runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
}

/** Wipe all local data (on logout, so another user never sees it). */
export async function clearAll() {
  const conn = await db();
  await conn.execAsync(`
    DELETE FROM events; DELETE FROM athletes; DELETE FROM results; DELETE FROM delays;
    DELETE FROM sync_queue; DELETE FROM cached_layouts; DELETE FROM meta;
  `);
}
