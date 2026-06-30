import api from './api';

export const getResults = async (eventId) => {
  const response = await api.get(`/events/${eventId}/results`);
  return response.data;
};

export const saveResult = async (eventId, resultData) => {
  const response = await api.post(`/events/${eventId}/results`, resultData);
  return response.data;
};

export const getStandings = async (eventId) => {
  const response = await api.get(`/events/${eventId}/standings`);
  return response.data;
};

export const updateResult = async (resultId, resultData) => {
  const response = await api.put(`/results/${resultId}`, resultData);
  return response.data;
};

export const deleteResult = async (resultId) => {
  const response = await api.delete(`/results/${resultId}`);
  return response.data;
};
