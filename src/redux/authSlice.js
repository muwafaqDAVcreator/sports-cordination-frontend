import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser, logoutUser, saveUser } from '../services/authService';
import { updateProfile as updateProfileApi, changePassword as changePasswordApi } from '../services/profileService';
import { errorMessage } from '../services/api';
import { resetData } from './dataSlice';
import { resetSync } from './syncSlice';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await loginUser(credentials);
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Login failed'));
  }
});

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    return await registerUser(data);
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Registration failed'));
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  await logoutUser();
  dispatch(resetData());
  dispatch(resetSync());
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const result = await updateProfileApi(data);
    await saveUser(result.data);
    return result.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Failed to update profile'));
  }
});

export const changePassword = createAsyncThunk('auth/changePassword', async (data, { rejectWithValue }) => {
  try {
    await changePasswordApi(data);
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Failed to change password'));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    restoring: true,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    restoreSession: (state, action) => {
      state.token = action.payload?.token || null;
      state.user = action.payload?.user || null;
      state.restoring = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, restoreSession } = authSlice.actions;
export default authSlice.reducer;
