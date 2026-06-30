import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';
import athletesReducer from './athletesSlice';
import resultsReducer from './resultsSlice';
import syncReducer from './syncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    athletes: athletesReducer,
    results: resultsReducer,
    sync: syncReducer,
  },
});
