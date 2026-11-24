// Web fallback for the local database (the browser preview has no native
// SQLite). Same API as localDb.native.js, persisted to AsyncStorage
// (localStorage). Android/iOS builds always use the SQLite implementation.

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'localdb:';
const DOMAIN_TABLES = ['events', 'athletes', 'results', 'delays'];
const cache = {};

async function load(key, fallback) {
  if (cache[key] !== undefined) return cache[key];
  const raw = await AsyncStorage.getItem(PREFIX + key);
  cache[key] = raw ? JSON.parse(raw) : fallback;
  return cache[key];
}

async function save(key, value) {
  cache[key] = value;
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export async function init() {}

export async function getAll(table) {
  return Object.values(await load(table, {}));
}

export async function put(table, record) {
  const t = { ...(await load(table, {})) };
  t[record.uuid] = record;
  await save(table, t);
}

export async function remove(table, uuid) {
  const t = { ...(await load(table, {})) };
  delete t[uuid];
  await save(table, t);
}

export async function replaceTable(table, records) {
  const t = {};
  for (const r of records) t[r.uuid] = r;
  await save(table, t);
}

export async function addMutation(m) {
  const q = await load('sync_queue', []);
  const seq = (await load('seq', 0)) + 1;
  await save('seq', seq);
  await save('sync_queue', [...q, { status: 'pending', attempts: 0, error: null, ...m, seq }]);
}

export async function getQueue() {
  return [...(await load('sync_queue', []))].sort((a, b) => a.seq - b.seq);
}

export async function updateMutation(id, patch) {
  const q = await load('sync_queue', []);
  await save('sync_queue', q.map((m) => (m.id === id ? { ...m, ...patch } : m)));
}

export async function removeMutation(id) {
  const q = await load('sync_queue', []);
  await save('sync_queue', q.filter((m) => m.id !== id));
}

export async function rewriteQueuedUuid(oldUuid, newUuid) {
  const q = await load('sync_queue', []);
  await save('sync_queue', q.map((m) => (m.uuid === oldUuid ? { ...m, uuid: newUuid } : m)));
}

export async function getLayout(role) {
  return (await load('layouts', {}))[role] || null;
}

export async function saveLayout(role, layout, fetchedAt = new Date().toISOString()) {
  const layouts = { ...(await load('layouts', {})) };
  layouts[role] = { ...layout, fetched_at: fetchedAt };
  await save('layouts', layouts);
}

export async function getMeta(key, fallback = null) {
  const meta = await load('meta', {});
  return meta[key] === undefined ? fallback : meta[key];
}

export async function setMeta(key, value) {
  const meta = { ...(await load('meta', {})) };
  meta[key] = value;
  await save('meta', meta);
}

export async function clearAll() {
  for (const key of [...DOMAIN_TABLES, 'sync_queue', 'layouts', 'meta', 'seq']) {
    delete cache[key];
    await AsyncStorage.removeItem(PREFIX + key);
  }
}
