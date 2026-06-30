import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDashboard, getEvents, createEvent as createEventApi } from '../services/dashboardService';
import { enqueue } from '../services/syncQueue';
import { isNetworkError, tempId } from '../utils/network';
import { refreshPendingCount } from './syncSlice';

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { rejectWithValue }) => {
  try {
    const result = await getDashboard();
    return result.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard');
  }
});

export const fetchEvents = createAsyncThunk('dashboard/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    const result = await getEvents();
    return result.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load events');
  }
});

export const addEvent = createAsyncThunk('dashboard/addEvent', async (eventData, { rejectWithValue, dispatch }) => {
  try {
    const result = await createEventApi(eventData);
    return result.data;
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueue({ type: 'CREATE_EVENT', payload: eventData });
      dispatch(refreshPendingCount());
      return {
        ...eventData,
        id: tempId(),
        status: 'upcoming',
        athletes: [],
        _pending: true,
      };
    }
    return rejectWithValue(err.response?.data?.message || 'Failed to create event');
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    events: [],
    todayEvents: [],
    stats: { total_events: 0, total_athletes: 0, results_entered: 0, pending_changes: 0 },
    lastSyncTime: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.todayEvents = action.payload.today_events;
        state.stats = action.payload.stats;
        state.lastSyncTime = action.payload.last_sync_time;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEvents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        state.events.unshift(action.payload);
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
