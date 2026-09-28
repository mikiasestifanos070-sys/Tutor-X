// Tutor-X backend
// -----------------
// Holds the Google API key server-side (loaded from .env, never sent to the
// browser) and forwards chat turns to the Gemini API. The frontend in
// public/index.html never sees the key — it only ever talks to this server.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'system-prompt.txt'),
  'utf8'
);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'The server is missing GOOGLE_API_KEY. Add it to your .env file (see .env.example) and restart the server.'
    });
  }

  const turns = Array.isArray(req.body && req.body.turns) ? req.body.turns : [];
  if (!turns.length) {
    return res.status(400).json({ error: 'No message was provided.' });
  }

  // Translate our {role: 'user'|'assistant', content} shape into Gemini's
  // {role: 'user'|'model', parts: [{text}]} shape.
  const contents = turns.map((t) => ({
    role: t.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String((t && t.content) || '') }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents
      })
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      console.error('Gemini API error', upstream.status, data);
      let message = 'Something went wrong reaching the AI. Please try again.';
      if (upstream.status === 400) {
        message = 'The request was rejected by the Google API (bad request). Check the server console for details.';
      } else if (upstream.status === 401 || upstream.status === 403) {
        message = 'The Google API key was rejected. Check GOOGLE_API_KEY in your .env file.';
      } else if (upstream.status === 404) {
        message = `Model "${MODEL}" was not found or is unsupported. Check GEMINI_MODEL in your .env file.`;
      } else if (upstream.status === 429) {
        message = 'Rate limited by Google — wait a moment and try again.';
      }
      return res.status(upstream.status).json({ error: message });
    }

    const candidate = data && data.candidates && data.candidates[0];
    const parts = candidate && candidate.content && candidate.content.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '';

    if (!text) {
      const reason = candidate && candidate.finishReason;
      const message =
        reason === 'SAFETY'
          ? "That question couldn't be answered — try rephrasing it."
          : "Tutor-X didn't produce a reply — try asking in a different way.";
      return res.status(200).json({ error: message });
    }

    res.json({ text });
  } catch (err) {
    console.error('Backend error contacting Gemini:', err);
    res.status(502).json({ error: 'Could not reach the Google API. Check your internet connection and try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Tutor-X is running — open http://localhost:${PORT} in your browser`);
  if (!API_KEY) {
    console.warn('WARNING: GOOGLE_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
});
