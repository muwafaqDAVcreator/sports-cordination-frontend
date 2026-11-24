# Sports Event Coordinator – Mobile App

React Native (Expo SDK 52) Android app for the **Offline-First Mobile Sports Event Coordination System featuring AI-Optimised Dashboards via SDUI** (Kingston University BSc Software Engineering final project).

It talks to the Laravel API in [`sports-cordination-backend`](https://github.com/muwafaqDAVcreator/sports-cordination-backend).

## Features

- Works fully offline: every change is saved to an on-device SQLite database and queued
- Automatic background sync on reconnect, on app resume and on a configurable interval
- Server-driven dashboard that re-prioritises itself when delays or bottlenecks are detected, cached for offline use
- Events with start/complete controls and delay logging
- Athlete registration with automatic bib numbers and houses
- Fast trackside results entry (Save & Next) with standings and medal table calculated on the device
- Sync Activity screen showing queued changes, rejected changes and resolved conflicts

## Requirements

Node 22, Android Studio emulator (or a phone) with Expo Go, and the backend API running on port 8000.

## Run

```bash
npm install
adb reverse tcp:8000 tcp:8000   # emulator reaches the API as localhost
adb reverse tcp:8081 tcp:8081
npx expo start                  # press "a" for Android
```

For a physical phone, set `API_URL` in `src/config.js` to your PC's LAN address and run the API with `php artisan serve --host=0.0.0.0`.

## Tests

```bash
npm test
```

## Project structure

```
src/
  logic/       sync, dashboard, standings and validation rules
  services/    SQLite store, local-first repository, sync engine, API client
  redux/       auth, data and sync state
  sdui/        dashboard component registry and renderer
  components/  sync status bar and background sync manager
  screens/     app screens
```

## Author

M.A.M Muwafaq (E297031) – supervised by Ms. Nethmini Abeysekare.
