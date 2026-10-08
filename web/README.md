# VisualEcho Web

The browser prototype uses the existing VisualEcho API for Cloud AI and an
explicit mock provider for demo mode. It does not run Gemma or Whisper in the
browser.

## Run locally

```sh
npm install
copy .env.example .env.local
npm run dev
```

Set `EXPO_PUBLIC_API_BASE_URL` to the API origin if using a different backend.
Only the API base URL is exposed in the browser bundle; never put backend
credentials in `EXPO_PUBLIC_*` variables.

The API needs to allow the web app's exact origin in `CORS_ORIGINS`. The
backend's development defaults include Vite's `http://localhost:5173`. For a
deployed web app, configure its exact HTTPS origin in the backend deployment
and redeploy the backend.

## Browser capabilities and modes

- **Cloud AI** calls the deployed backend's health, word-generation,
  speech-evaluation, and drawing-analysis endpoints. Failures remain visible;
  Cloud AI never falls back to demo data.
- **Local demo** uses `MockAIProvider`; it is not local Gemma or image
  recognition.
- Speech input uses browser speech recognition when available, otherwise
  typed transcripts. Word playback uses browser speech synthesis with
  selectable installed voices and adjustable speed; voice availability varies
  by browser and operating system. Practice feedback is read aloud and can be
  replayed. Word pictures come from actual photo results on Wikimedia
  Commons. The selected word is sent to Commons for the photo search, and
  image attribution/license information links back to its source page. If no
  photo is available, the UI says so rather than substituting an illustration.
- Drawing uses a browser canvas. Cloud analysis sends the chosen drawing to
  the backend; demo mode does not claim to interpret the image.
- Practice progress is saved in browser local storage.
