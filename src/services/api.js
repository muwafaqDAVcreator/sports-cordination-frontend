import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorMessage = (err, fallback = 'Something went wrong') => {
  if (!err?.response) return 'Cannot reach the server. Check your connection.';
  const data = err.response.data || {};
  const firstField = data.errors && Object.values(data.errors)[0];
  return (Array.isArray(firstField) ? firstField[0] : null) || data.message || fallback;
};

export default api;
