# Captain — Personal Voice Assistant

Captain is a Siri/Alexa-style voice assistant that runs right in your browser. Built with React and Tailwind CSS on the frontend and an optional FastAPI AI fallback backend, Captain combines zero-latency local speech recognition and command routing with external knowledge APIs and neural AI fallback.

---

## Features

- **Wake-Word Mode**: Say *"Captain"* anywhere in your utterance (e.g., *"Captain, what is the time"*, or bare *"Captain"* to wake the assistant). Toggleable switch with continuous listening loop protection.
- **Local Command Router**: Instant client-side intent recognition for device queries with zero network delay (time, date, jokes, assistant identity, voice playback control like stop and repeat).
- **Calculator**: Safe custom tokenizer and recursive descent expression evaluator supporting symbols (`12 * 8`), spoken math phrases (*"four plus five"*, *"multiplied by"*, *"divided by"*), floating-point noise elimination (`0.1 + 0.2 = 0.3`), and division-by-zero guard without using `eval()`.
- **Wikipedia Knowledge**: Direct MediaWiki REST integration to fetch concise, clean introductory summaries for figures, science, and history topics (*"Who was Albert Einstein"*, *"Tell me about Mars"*).
- **Weather Forecasts**: Geocoding and meteorological data powered by Open-Meteo, translating WMO condition codes into spoken natural language (*"Weather in Hyderabad"*, *"How is the weather in Paris"*).
- **Websites & Media Search**: Direct navigation for 14 major services (*"Open YouTube"*, *"Open GitHub"*, *"Open Reddit"*) plus specialized YouTube video lookup (*"Play jazz music on YouTube"*) and Google search (*"Google Vite tutorials"*).
- **Conversational AI Fallback (Gemini)**: Complex or unmapped conversational questions gracefully fall back to a lightweight FastAPI backend powered by Google Gemini.
- **Central Animated Orb**: Dynamic audio-visual centerpiece with distinct animated states for **Idle** (resting glow), **Listening** (radiating concentric pulses), **Speaking** (real-time waveform bars), and **Thinking** (neural sync indicator).
- **Accessibility & Fallback**: Full keyboard accessibility, typed command input for environments without microphones, screen-reader aria labels, and textual mic status.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React 19 Frontend (Vite)                   │
│                                                                 │
│  ┌───────────────────────┐         ┌─────────────────────────┐  │
│  │   Web Speech API      │         │     Interactive Orb     │  │
│  │ (SpeechRecognition /  │         │  (Listening / Speaking /│  │
│  │   SpeechSynthesis)    │         │     Thinking / Idle)    │  │
│  └──────────┬────────────┘         └────────────▲────────────┘  │
│             │                                   │               │
│             ▼                                   │               │
│  ┌──────────────────────────────────────────────┴────────────┐  │
│  │         Pure Client-Side Command Router                   │  │
│  │  - Wake Word Extractor (extractWakeCommand)               │  │
│  │  - Local Intents (Time, Date, Identity, Jokes, Controls)  │  │
│  │  - Safe Math Evaluator (calculator.js)                    │  │
│  │  - Direct Navigation (YouTube, Google, 14 Web Apps)       │  │
│  └──────┬──────────────────────┬──────────────────────┬──────┘  │
└─────────┼──────────────────────┼──────────────────────┼─────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Wikipedia API   │   │  Open-Meteo API  │   │ FastAPI Backend  │
│ (MediaWiki REST) │   │ (Geocode + WMO)  │   │  (Port 8000)     │
└──────────────────┘   └──────────────────┘   └────────┬─────────┘
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │  Google Gemini   │
                                              │ (AI Fallback API)│
                                              └──────────────────┘
```

- **Frontend**: Handles speech recognition, wake-word detection, audio synthesis, UI state, and local command execution entirely in the browser. When the user asks for Wikipedia or weather data, the browser calls Open-Meteo and MediaWiki directly without server proxying.
- **FastAPI Backend**: Dedicated exclusively to conversational AI fallback for queries that don't match local rules. Reads `GEMINI_API_KEY` from the server environment. If the API key is not set, the backend responds with a friendly guidance message and marks `ai_configured: false`, which triggers an "AI brain offline" indicator in the frontend without breaking any other features.

---

## Setup & Run

### 1. Frontend Setup

Ensure you have Node.js 18+ installed.

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

To build for production:
```bash
npm run build
```

---

### 2. Backend Setup (FastAPI)

The backend provides the optional Gemini AI chat fallback.

```bash
# Navigate to backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt -r requirements-dev.txt
```

#### Running the Backend

Because the application imports using the package path `from backend.ai_service import ...`, run Uvicorn from the **project root directory**:

```bash
# From project root:
uvicorn backend.main:app --reload --port 8000
```

Alternatively, from inside the `backend/` directory:
```bash
PYTHONPATH=.. uvicorn main:app --reload --port 8000
```

#### Environment Variables

- `GEMINI_API_KEY` (*optional*): Set your Google Gemini API key to enable generative AI responses.
  ```bash
  export GEMINI_API_KEY="your-gemini-api-key"
  ```
  If unset, the backend runs gracefully in unconfigured mode and advises the user to configure the key, while all local and external intents continue to work seamlessly.
- `CORS_ORIGINS` (*optional*): JSON array of allowed frontend origins (e.g. `CORS_ORIGINS='["https://my-app.vercel.app"]'`), set it on the backend host in production.

---

## Voice Commands Reference

| Category | Example Utterance | Result / Action |
| :--- | :--- | :--- |
| **Wake Word** | *"Captain"* | Acknowledges *"Yes? I'm listening."* |
| **Wake + Command** | *"Captain, what is the time?"* | Extracts command and speaks current time |
| **Time & Date** | *"What time is it?"* / *"Today's date"* | Current local time / formatted date |
| **Weather** | *"Weather in Hyderabad"* / *"Weather in Paris"* | Current temperature, skies, humidity, wind |
| **Calculator** | *"Calculate 12 * 8"* / *"4 plus 5"* | Evaluates arithmetic expression safely |
| **Wikipedia** | *"Who was Albert Einstein?"* / *"Tell me about Mars"* | Introductory summary from Wikipedia |
| **Websites** | *"Open YouTube"* / *"Open GitHub"* / *"Open Gmail"* | Launches destination site in a new tab |
| **Search** | *"Google React tutorials"* / *"Play lofi on YouTube"* | Performs query on Google or YouTube |
| **Playback** | *"Stop"* / *"Be quiet"* / *"Repeat that"* | Halts active speech / re-speaks last reply |
| **Jokes & Identity** | *"Tell me a joke"* / *"Who are you?"* | Spoken humor / assistant self-introduction |
| **Conversational AI** | *"Explain quantum tunneling in simple terms"* | Routes to FastAPI backend (Gemini) |

---

## Honest Browser Support & Limitations

- **Speech Recognition**: Web Speech recognition (`window.SpeechRecognition` or `window.webkitSpeechRecognition`) requires a Chromium-based browser (**Google Chrome** or **Microsoft Edge**). Mozilla Firefox and Apple Safari do not support continuous SpeechRecognition. On unsupported browsers, the assistant displays a notice banner; all typed commands and UI controls remain fully functional.
- **Wake-Word & Continuous Listening**: Wake-word detection relies on the browser's speech recognition remaining active. The browser tab must stay open and microphone permission must be granted. Modern browsers pause microphone capture when the tab is backgrounded or minimized to preserve system resources and privacy.
- **Speech Synthesis (TTS)**: Web Speech Synthesis is supported across all major modern browsers, but voice quality, naturalness, and available accents vary significantly depending on the client OS (macOS, Windows, Linux, Android, iOS) and installed system voices.
- **Audio Privacy**: The standard browser Web Speech API streams microphone audio packets to browser vendor servers (Google or Microsoft speech services) for cloud transcription. Voice recognition is not 100% offline or on-device private.

---

## Testing

### Frontend Tests (Vitest)
All frontend unit tests are consolidated under `src/lib/__tests__/`:

```bash
npm test
```

### Backend Tests (pytest)
Runs the test suite verifying health checks, CORS headers, validation, and Gemini fallback mocking:

```bash
backend/.venv/bin/python -m pytest backend/tests -q
```

---

## Project Structure Overview

```
personal-voice-assistant/
├── backend/
│   ├── .venv/                      # Python virtual environment
│   ├── ai_service.py               # Gemini API client & model fallback
│   ├── main.py                     # FastAPI routes (/health, /api/chat) & CORS
│   ├── requirements.txt            # Production dependencies (fastapi, uvicorn, google-genai)
│   ├── requirements-dev.txt        # Development dependencies (pytest, httpx)
│   └── tests/
│       └── test_api.py             # 13 backend pytest integration tests
├── src/
│   ├── components/
│   │   ├── BrowserNotice.jsx       # Alert when SpeechRecognition is unsupported
│   │   ├── Controls.jsx            # Mic button, stop voice, wake toggle, input, chips
│   │   ├── Orb.jsx                 # Animated central sphere (Idle, Listening, Speaking, Thinking)
│   │   └── Transcript.jsx          # Live conversation feed with auto-scroll
│   ├── hooks/
│   │   ├── useSpeechRecognition.js # SpeechRecognition wrapper with loop guards
│   │   └── useSpeechSynthesis.js   # SpeechSynthesis wrapper with state tracking
│   ├── lib/
│   │   ├── __tests__/              # Consolidated unit test suites (140 tests)
│   │   │   ├── calculator.test.js
│   │   │   ├── chatService.test.js
│   │   │   ├── commandRouter.test.js
│   │   │   ├── services.test.js
│   │   │   └── wakeWord.test.js
│   │   ├── calculator.js           # Safe tokenizer and math expression evaluator
│   │   ├── chatService.js          # Client bridge to FastAPI backend AI endpoint
│   │   ├── commandRouter.js        # Pure client-side intent classifier & router
│   │   ├── services.js             # Wikipedia MediaWiki & Open-Meteo weather fetchers
│   │   └── wakeWord.js             # extractWakeCommand pure helper function
│   ├── App.jsx                     # Main assistant shell, pipeline & layout
│   ├── config.js                   # Assistant settings (ASSISTANT_NAME = 'Captain')
│   ├── index.css                   # Tailwind CSS imports & animations
│   └── main.jsx                    # React entrypoint
├── package.json
├── vite.config.js
└── README.md
```
