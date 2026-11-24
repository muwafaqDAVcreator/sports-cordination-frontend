// Thunks connecting the UI to the local database, repository and sync engine.

import * as db from '../services/localDb';
import * as repo from '../services/repository';
import * as syncEngine from '../services/syncEngine';
import { setLocalData } from './dataSlice';
import { setSyncInfo, syncStarted, syncFinished } from './syncSlice';
import { DEFAULT_SYNC_INTERVAL_MINUTES } from '../config';

const roleOf = (state) => (state.auth.user?.role === 'admin' ? 'admin' : 'coordinator');

/** Reload Redux from the on-device database. */
export const refreshLocal = () => async (dispatch, getState) => {
  await db.init();
  const role = roleOf(getState());
  const [events, athletes, results, delays, layout, queue, lastSyncAt, lastResult, conflictLog, autoSync, intervalMinutes] = await Promise.all([
    db.getAll('events'),
    db.getAll('athletes'),
    db.getAll('results'),
    db.getAll('delays'),
    db.getLayout(role),
    db.getQueue(),
    db.getMeta('last_sync_at'),
    db.getMeta('last_sync_result'),
    db.getMeta('conflict_log', []),
    db.getMeta('auto_sync', true),
    db.getMeta('sync_interval_minutes', DEFAULT_SYNC_INTERVAL_MINUTES),
  ]);
  dispatch(setLocalData({ events, athletes, results, delays, layout }));
  dispatch(setSyncInfo({ queue, lastSyncAt, lastResult, conflictLog, autoSync, intervalMinutes }));
};

/** Run a full sync (push, pull, layout) if online. Returns the summary. */
export const runSync = ({ force = false } = {}) => async (dispatch, getState) => {
  const { sync, auth } = getState();
  if (!auth.token) return null;
  if (!sync.isOnline && !force) return { error: 'Offline - changes are saved on this device and will sync automatically' };

  dispatch(syncStarted());
  const summary = await syncEngine.sync({ role: roleOf(getState()) });
  await dispatch(refreshLocal());
  dispatch(syncFinished(summary));
  return summary;
};

/** After a local write: refresh the UI and, if allowed, sync in the background. */
const afterWrite = () => async (dispatch, getState) => {
  await dispatch(refreshLocal());
  const { sync } = getState();
  if (sync.isOnline && sync.autoSync) dispatch(runSync());
};

const write = (fn) => (...args) => async (dispatch) => {
  const result = await fn(...args);
  await dispatch(afterWrite());
  return result;
};

export const saveEvent = write(repo.saveEvent);
export const setEventStatus = write(repo.setEventStatus);
export const deleteEvent = write(repo.deleteEvent);
export const logDelay = write(repo.logDelay);
export const saveAthlete = write(repo.saveAthlete);
export const deleteAthlete = write(repo.deleteAthlete);
export const saveResult = write(repo.saveResult);
export const deleteResult = write(repo.deleteResult);

export const setAutoSync = (enabled) => async (dispatch) => {
  await db.setMeta('auto_sync', enabled);
  await dispatch(refreshLocal());
};

export const setSyncInterval = (minutes) => async (dispatch) => {
  await db.setMeta('sync_interval_minutes', minutes);
  await dispatch(refreshLocal());
};

export const discardMutation = (id) => async (dispatch) => {
  await syncEngine.discardMutation(id);
  await dispatch(runSync());
  await dispatch(refreshLocal());
};

export const retryMutation = (id) => async (dispatch) => {
  await syncEngine.retryMutation(id);
  await dispatch(runSync());
};
