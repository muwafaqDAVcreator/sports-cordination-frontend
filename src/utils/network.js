export const isNetworkError = (err) => !err.response;

export const tempId = () => `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`;
