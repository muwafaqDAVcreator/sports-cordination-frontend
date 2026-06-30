import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getQueue } from '../services/syncQueue';
import { processSyncQueue } from '../services/syncService';

export const refreshPendingCount = createAsyncThunk('sync/refreshPendingCount', async () => {
  const queue = await getQueue();
  return queue.length;
});

export const runSync = createAsyncThunk('sync/run', async (_, { dispatch, getState }) => {
  const { sync } = getState();
  if (sync.syncing) return { succeeded: 0, failed: 0 };

  const result = await processSyncQueue();
  await dispatch(refreshPendingCount());
  return result;
});

const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    isOnline: true,
    pendingCount: 0,
    syncing: false,
    lastSyncAt: null,
  },
  reducers: {
    setOnline: (state, action) => { state.isOnline = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshPendingCount.fulfilled, (state, action) => {
        state.pendingCount = action.payload;
      })
      .addCase(runSync.pending, (state) => { state.syncing = true; })
      .addCase(runSync.fulfilled, (state) => {
        state.syncing = false;
        state.lastSyncAt = new Date().toISOString();
      })
      .addCase(runSync.rejected, (state) => { state.syncing = false; });
  },
});

export const { setOnline } = syncSlice.actions;
export default syncSlice.reducer;
