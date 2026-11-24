import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_SYNC_INTERVAL_MINUTES } from '../config';

const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    isOnline: true,
    syncing: false,
    queue: [],            // full queue, for the Sync Activity screen
    pendingCount: 0,
    failedCount: 0,
    lastSyncAt: null,
    lastResult: null,
    conflictLog: [],
    autoSync: true,
    intervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
  },
  reducers: {
    setOnline: (state, action) => { state.isOnline = action.payload; },
    syncStarted: (state) => { state.syncing = true; },
    syncFinished: (state, action) => {
      state.syncing = false;
      state.lastResult = action.payload;
    },
    setSyncInfo: (state, action) => {
      const { queue, lastSyncAt, lastResult, conflictLog, autoSync, intervalMinutes } = action.payload;
      state.queue = queue;
      state.pendingCount = queue.filter((m) => m.status === 'pending').length;
      state.failedCount = queue.filter((m) => m.status === 'failed').length;
      state.lastSyncAt = lastSyncAt;
      if (lastResult) state.lastResult = lastResult;
      state.conflictLog = conflictLog;
      state.autoSync = autoSync;
      state.intervalMinutes = intervalMinutes;
    },
    resetSync: (state) => {
      state.queue = [];
      state.pendingCount = 0;
      state.failedCount = 0;
      state.lastSyncAt = null;
      state.lastResult = null;
      state.conflictLog = [];
    },
  },
});

export const { setOnline, syncStarted, syncFinished, setSyncInfo, resetSync } = syncSlice.actions;
export default syncSlice.reducer;
