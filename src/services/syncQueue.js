import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'sync_queue';

export const getQueue = async () => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const enqueue = async (action) => {
  const queue = await getQueue();
  const item = { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, ...action, createdAt: Date.now() };
  queue.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return item;
};

export const removeFromQueue = async (itemId) => {
  const queue = await getQueue();
  const updated = queue.filter((item) => item.id !== itemId);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
};

export const clearQueue = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};
