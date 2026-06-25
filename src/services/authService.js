import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const { token, user } = response.data;
  await AsyncStorage.setItem('auth_token', token);
  return { token, user };
};

export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data);
  const { token, user } = response.data;
  await AsyncStorage.setItem('auth_token', token);
  return { token, user };
};

export const logoutUser = async () => {
  await api.post('/auth/logout');
  await AsyncStorage.removeItem('auth_token');
};

export const getUser = async () => {
  const response = await api.get('/auth/user');
  return response.data;
};

export const getSavedToken = async () => {
  return await AsyncStorage.getItem('auth_token');
};
