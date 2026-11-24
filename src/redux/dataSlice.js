// In-memory view of the on-device database. Screens read only from here;
// it is refreshed from SQLite after every local write and every sync, so the
// UI is always rendering local data (offline-first), never waiting on HTTP.

import { createSlice } from '@reduxjs/toolkit';

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    events: [],
    athletes: [],
    results: [],
    delays: [],
    layout: null,
    loaded: false,
  },
  reducers: {
    setLocalData: (state, action) => {
      const { events, athletes, results, delays, layout } = action.payload;
      state.events = events;
      state.athletes = athletes;
      state.results = results;
      state.delays = delays;
      state.layout = layout;
      state.loaded = true;
    },
    resetData: (state) => {
      state.events = [];
      state.athletes = [];
      state.results = [];
      state.delays = [];
      state.layout = null;
      state.loaded = false;
    },
  },
});

export const { setLocalData, resetData } = dataSlice.actions;
export default dataSlice.reducer;

// ---------------------------------------------------------------- selectors

const byDateTime = (a, b) => `${a.event_date} ${a.start_time}`.localeCompare(`${b.event_date} ${b.start_time}`);

export const selectEvents = (state) => [...state.data.events].sort(byDateTime);
export const selectEvent = (uuid) => (state) => state.data.events.find((e) => e.uuid === uuid) || null;
export const selectAthletesFor = (eventUuid) => (state) =>
  state.data.athletes.filter((a) => a.event_uuid === eventUuid).sort((a, b) => (a.bib_number || 0) - (b.bib_number || 0));
export const selectResultsFor = (eventUuid) => (state) => state.data.results.filter((r) => r.event_uuid === eventUuid);
export const selectDelaysFor = (eventUuid) => (state) =>
  state.data.delays.filter((d) => d.event_uuid === eventUuid).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
export const totalDelay = (delays) => delays.reduce((sum, d) => sum + (d.delay_minutes || 0), 0);
