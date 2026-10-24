# Wakha in Expo Go

Wakha is one web page, so this tiny Expo app just shows it full-screen in a WebView.

## Try it on your phone

1. Install **Expo Go** on your phone (App Store / Play Store).
2. On your computer (Node 20+), in this folder:
   ```
   npm install
   npm start
   ```
   `npm start` copies the latest build (`../dist/preview.html`) into the app, then prints a QR code.
3. Scan the QR: with the Camera app on iPhone, or from inside Expo Go on Android.
   Phone and computer must be on the same Wi‑Fi. If they aren't (or the QR won't load), use `npm run tunnel`.

After changing the app, run `node build/build.js` in the main folder, then `npm start` again.

## Start over as a new user

Me → Developer → **Start over**, tap it twice. Everything is wiped and onboarding starts again.
