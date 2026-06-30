import api from './api';

export const getAthletes = async (eventId) => {
  const response = await api.get(`/events/${eventId}/athletes`);
  return response.data;
};

export const addAthlete = async (eventId, athleteData) => {
  const response = await api.post(`/events/${eventId}/athletes`, athleteData);
  return response.data;
};

export const updateAthlete = async (athleteId, athleteData) => {
  const response = await api.put(`/athletes/${athleteId}`, athleteData);
  return response.data;
};

export const deleteAthlete = async (athleteId) => {
  const response = await api.delete(`/athletes/${athleteId}`);
  return response.data;
};
