# Tutor-X — standalone local app

A small Express backend + a static HTML/JS frontend. The backend holds your
Google API key in a `.env` file (never in the browser) and forwards chat
messages to the Gemini API. Run it locally and open it in your browser —
sending messages actually works, no Claude/artifact environment required.

```
tutor-x-standalone/
├── server.js          the backend (Express) — talks to Google's Gemini API
├── system-prompt.txt  the Tutor-X system prompt, loaded by server.js
├── package.json
├── .env.example        copy this to .env and add your real key
├── .gitignore
└── public/
    └── index.html      the frontend — chat UI, voice input/output, settings
```

## 1. Requirements

- **Node.js 18 or newer** (needed for the built-in `fetch`). Check with:
  ```
  node -v
  ```
  If you don't have it, install from https://nodejs.org.
- **A Google API key that is enabled for the Gemini API**, from
  https://aistudio.google.com/apikey. This must specifically be a *Gemini*
  key — a key scoped only to Google Maps/Places/YouTube, or a key from a
  different provider entirely (like Anthropic, which looks like
  `sk-ant-...`), will not work here. If you already have a Google API key
  and aren't sure it has Gemini access, the simplest fix is to generate a
  fresh key directly from the AI Studio link above.

## 2. Setup (one time)

Open a terminal in the `tutor-x-standalone` folder and run:

```bash
npm install
```

Then create your `.env` file from the template:

```bash
cp .env.example .env
```

Open `.env` in any text editor and paste your real key in:

```
GOOGLE_API_KEY=your_actual_key_here
```

Save the file. `.env` is listed in `.gitignore` and is never read by the
frontend — only `server.js` loads it, on the server side.

## 3. Run it

```bash
npm start
```

You should see:

```
Tutor-X is running — open http://localhost:3000 in your browser
```

Open **http://localhost:3000** in your browser (Chrome or Edge recommended
for full voice support). Type a message and press Enter, or click Send —
it will actually reach Gemini and reply.

To stop the server, press `Ctrl+C` in the terminal.

## 4. What works standalone vs. what's browser-dependent

- **Chat (Enter / Send)** — works fully once the server is running with a
  valid key; this was the whole point of this build.
- **Voice input (mic) and voice output (speaker)** — use your browser's
  own built-in speech engine (Web Speech API), not the backend. No key
  needed for these, but browser support varies: best in Chrome/Edge,
  limited in Safari. If your browser doesn't support one of these, that
  button hides itself automatically instead of showing something broken.
- **Voice settings** (voice choice, speed, auto-read) are also
  browser-side and saved locally in your browser between visits.

## 5. Troubleshooting

- **"The Google API key was rejected"** — double check you copied the
  whole key into `.env` with no extra spaces, and that it's a Gemini-
  enabled key (see step 1), not a Maps/Places-only key.
- **"The server is missing GOOGLE_API_KEY"** — you haven't created `.env`
  yet, or it's missing that line. Repeat step 2.
- **Model not found (404)** — your key may not have access to the model
  named in `GEMINI_MODEL` in `.env`. Try changing it to a model your key
  does have access to (check your Google AI Studio account for which
  models are available to you), then restart the server.
- **Nothing happens when you open the page** — make sure the terminal is
  still running `npm start` and that you're visiting
  `http://localhost:3000`, not opening `public/index.html` directly by
  double-clicking it. Opening the raw file skips the server entirely, so
  there's nothing for it to talk to.
- **Port already in use** — add `PORT=3001` (or any free port) to `.env`
  and restart, then open `http://localhost:3001` instead.

## 6. Changing the model later

Edit `GEMINI_MODEL` in `.env` to any model name your API key has access
to, then restart the server (`Ctrl+C`, then `npm start` again). No code
changes needed.
