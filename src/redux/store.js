import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dataReducer from './dataSlice';
import syncReducer from './syncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    data: dataReducer,
    sync: syncReducer,
  },
});
