// Backend address. On the Android emulator, `adb reverse tcp:8000 tcp:8000`
// makes the PC's Laravel server reachable as localhost; on a physical device
// replace this with the PC's LAN address (and run `php artisan serve --host=0.0.0.0`).
export const API_URL = 'http://localhost:8000/api';

// Highest SDUI schema version this client's component registry can render.
export const SDUI_SCHEMA_VERSION = 2;

// Sync engine tuning.
export const SYNC_BATCH_SIZE = 50;
export const DEFAULT_SYNC_INTERVAL_MINUTES = 5;
