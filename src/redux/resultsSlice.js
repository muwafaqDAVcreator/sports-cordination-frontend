import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as resultService from '../services/resultService';
import { enqueue } from '../services/syncQueue';
import { isNetworkError, tempId } from '../utils/network';
import { refreshPendingCount } from './syncSlice';

export const fetchResults = createAsyncThunk('results/fetch', async (eventId, { rejectWithValue }) => {
  try {
    const result = await resultService.getResults(eventId);
    return result.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load results');
  }
});

export const fetchStandings = createAsyncThunk('results/fetchStandings', async (eventId, { rejectWithValue }) => {
  try {
    const result = await resultService.getStandings(eventId);
    return result.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load standings');
  }
});

export const saveResult = createAsyncThunk('results/save', async ({ eventId, data }, { rejectWithValue, dispatch }) => {
  try {
    const result = await resultService.saveResult(eventId, data);
    return result.data;
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueue({ type: 'SAVE_RESULT', payload: { eventId, data } });
      dispatch(refreshPendingCount());
      return { ...data, id: tempId(), event_id: eventId, _pending: true };
    }
    return rejectWithValue(err.response?.data?.message || 'Failed to save result');
  }
});

export const removeResult = createAsyncThunk('results/remove', async (resultId, { rejectWithValue }) => {
  try {
    await resultService.deleteResult(resultId);
    return resultId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete result');
  }
});

const resultsSlice = createSlice({
  name: 'results',
  initialState: {
    results: [],
    rankings: [],
    housePoints: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearResultsError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResults.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStandings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStandings.fulfilled, (state, action) => {
        state.loading = false;
        state.rankings = action.payload.rankings;
        state.housePoints = action.payload.house_points;
      })
      .addCase(fetchStandings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveResult.fulfilled, (state, action) => {
        const index = state.results.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) state.results[index] = action.payload;
        else state.results.push(action.payload);
      })
      .addCase(removeResult.fulfilled, (state, action) => {
        state.results = state.results.filter((r) => r.id !== action.payload);
      });
  },
});

export const { clearResultsError } = resultsSlice.actions;
export default resultsSlice.reducer;
