# Jarvis — Personal Voice Assistant (Phase 1: Foundation)

A Siri/Alexa-style personal voice assistant web application built with React, Vite, and Tailwind CSS.

## Features (Phase 1)
- **Continuous Speech Recognition**: Wraps `window.SpeechRecognition` / `window.webkitSpeechRecognition` with continuous listening, interim transcript display, and restart loop guards.
- **Speech Synthesis (TTS)**: Utterance audio synthesis with automatic voice selection and state tracking.
- **Client-Side Command Router**: Case-insensitive and punctuation-tolerant command router supporting greetings, time, date, jokes, assistant identity, and polite fallback handling.
- **Central Animated Orb**: Dynamic visual states for Idle (subtle pulse), Listening (expanding concentric rings), and Speaking (audio waveform).
- **Graceful Fallbacks & Accessibility**: Typed command fallback input for browsers without SpeechRecognition or environments without microphones.

## Getting Started
```bash
npm install
npm run dev
```

To build for production:
```bash
npm run build
```
