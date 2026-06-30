import api from './api';
import { getQueue, removeFromQueue } from './syncQueue';

const ACTION_EXECUTORS = {
  CREATE_EVENT: (payload) => api.post('/events', payload),
  ADD_ATHLETE: ({ eventId, data }) => api.post(`/events/${eventId}/athletes`, data),
  SAVE_RESULT: ({ eventId, data }) => api.post(`/events/${eventId}/results`, data),
};

export const processSyncQueue = async () => {
  const queue = await getQueue();
  const results = { succeeded: 0, failed: 0 };

  for (const item of queue) {
    const executor = ACTION_EXECUTORS[item.type];
    if (!executor) {
      await removeFromQueue(item.id);
      continue;
    }
    try {
      await executor(item.payload);
      await removeFromQueue(item.id);
      results.succeeded += 1;
    } catch (err) {
      results.failed += 1;
      break;
    }
  }

  if (results.succeeded > 0) {
    try {
      await api.post('/sync');
    } catch {
      // last_sync_at touch is best-effort
    }
  }

  return results;
};
