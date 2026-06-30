import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as athleteService from '../services/athleteService';
import { enqueue } from '../services/syncQueue';
import { isNetworkError, tempId } from '../utils/network';
import { refreshPendingCount } from './syncSlice';

export const fetchAthletes = createAsyncThunk('athletes/fetch', async (eventId, { rejectWithValue }) => {
  try {
    const result = await athleteService.getAthletes(eventId);
    return result.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load athletes');
  }
});

export const addAthlete = createAsyncThunk('athletes/add', async ({ eventId, data }, { rejectWithValue, dispatch }) => {
  try {
    const result = await athleteService.addAthlete(eventId, data);
    return result.data;
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueue({ type: 'ADD_ATHLETE', payload: { eventId, data } });
      dispatch(refreshPendingCount());
      return { ...data, id: tempId(), event_id: eventId, _pending: true };
    }
    return rejectWithValue(err.response?.data?.message || 'Failed to add athlete');
  }
});

export const editAthlete = createAsyncThunk('athletes/edit', async ({ athleteId, data }, { rejectWithValue }) => {
  try {
    const result = await athleteService.updateAthlete(athleteId, data);
    return result.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update athlete');
  }
});

export const removeAthlete = createAsyncThunk('athletes/remove', async (athleteId, { rejectWithValue }) => {
  try {
    await athleteService.deleteAthlete(athleteId);
    return athleteId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete athlete');
  }
});

const athletesSlice = createSlice({
  name: 'athletes',
  initialState: {
    athletes: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAthletesError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAthletes.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAthletes.fulfilled, (state, action) => {
        state.loading = false;
        state.athletes = action.payload;
      })
      .addCase(fetchAthletes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addAthlete.fulfilled, (state, action) => {
        state.athletes.push(action.payload);
      })
      .addCase(editAthlete.fulfilled, (state, action) => {
        const index = state.athletes.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) state.athletes[index] = action.payload;
      })
      .addCase(removeAthlete.fulfilled, (state, action) => {
        state.athletes = state.athletes.filter((a) => a.id !== action.payload);
      });
  },
});

export const { clearAthletesError } = athletesSlice.actions;
export default athletesSlice.reducer;
