# Meeting Copilot for phones

An Expo (React Native) app for iOS and Android: record in-person meetings, read summaries and
transcripts, ask your history, see what you owe, and get live answer cards on your phone (with a buzz)
while a meeting is live on your laptop or with a bot.

Phones don't let apps record another app's call audio, so phone capture is for in-person and
speakerphone meetings. Recording only starts when you tap it, after confirming everyone agreed.

## Run it

```bash
cd services/meeting-copilot/mobile
npm install
npx expo start            # scan the QR code with Expo Go, or press a / i for an emulator
```

Sign in with your server's address (it must be reachable from the phone, over HTTPS for anything but
a LAN test) and a personal access token from **Settings → Account → Access tokens** in the web app.

## Checks

```bash
npm run typecheck
CI=1 npx expo export --platform android   # bundles the app the way a release build does
```

## Not in this app yet

- **On-device speech to text (sherpa-onnx).** The spec's default for phones. It needs a native module
  and a development build (not Expo Go); recordings are transcribed on your server instead.
- **Live capture from the phone.** The phone is a second screen for live cards; capture live from the
  web app or desktop recorder, or send a bot.
- Watch haptics and TV surfaces are future targets.
