# Sports Event Coordinator – Mobile App

React Native (Expo SDK 52) Android app for the **Offline-First Mobile Sports Event Coordination System featuring AI-Optimised Dashboards via SDUI** (Kingston University BSc Software Engineering final project).

It talks to the Laravel API in [`sports-cordination-backend`](https://github.com/muwafaqDAVcreator/sports-cordination-backend), which is hosted at `https://api-app.muwamurad.com/api` for testing.

## Features

- Works fully offline: every change is saved to an on-device SQLite database and queued
- Automatic background sync on reconnect, on app resume and on a configurable interval
- Server-driven dashboard that re-prioritises itself when delays or bottlenecks are detected, cached for offline use
- Events with start/complete controls and delay logging
- Athlete registration with automatic bib numbers and houses
- Fast trackside results entry (Save & Next) with standings and medal table calculated on the device
- Sync Activity screen showing queued changes, rejected changes and resolved conflicts

## Requirements

Node 22 and an Android Studio emulator (or a phone) with Expo Go.

## Run

By default the app uses the hosted API, so this is enough:

```bash
npm install
npx expo start                  # press "a" for Android
```

To use a local API instead, set `EXPO_PUBLIC_API_URL` before starting Expo:

```bash
adb reverse tcp:8000 tcp:8000   # emulator reaches the API as localhost
EXPO_PUBLIC_API_URL=http://localhost:8000/api npx expo start
```

## Build the Android APK

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

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
