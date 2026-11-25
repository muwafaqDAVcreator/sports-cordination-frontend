// Backend address. Defaults to the hosted API so the release APK works out of
// the box. For local development set EXPO_PUBLIC_API_URL before starting Expo,
// e.g. EXPO_PUBLIC_API_URL=http://localhost:8000/api (with `adb reverse tcp:8000
// tcp:8000` on the Android emulator).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-app.muwamurad.com/api';

// Highest SDUI schema version this client's component registry can render.
export const SDUI_SCHEMA_VERSION = 2;

// Sync engine tuning.
export const SYNC_BATCH_SIZE = 50;
export const DEFAULT_SYNC_INTERVAL_MINUTES = 5;
