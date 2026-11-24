import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import * as db from './localDb';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

async function persist({ token, user }) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  return { token, user };
}

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  // A different coordinator on this device must never see the previous one's data.
  const previous = await getSavedUser();
  if (previous && previous.id !== response.data.user.id) await db.clearAll();
  return persist(response.data);
};

export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data);
  await db.clearAll();
  return persist(response.data);
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Offline logout still clears the device; the token expires server-side.
  }
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  await db.clearAll();
};

export const getUser = async () => {
  const response = await api.get('/auth/user');
  return response.data;
};

export const saveUser = async (user) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

export const getSavedToken = async () => AsyncStorage.getItem(TOKEN_KEY);

export const getSavedUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};
