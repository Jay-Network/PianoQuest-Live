# PianoQuest Live

**Real-time AI piano coaching with Gemini Live API.**

Play your MIDI keyboard, talk to the AI, and get real-time coaching through voice conversation and visual feedback. Your playing drives the session — Gemini listens to your audio, reads your MIDI data, and coaches you like a teacher sitting next to you on the bench.

Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/) — **Creative Storyteller** category.

**Live Demo:** https://pianoquest-live-604879855725.us-central1.run.app

![Architecture](docs/architecture.svg)

---

## What It Does

PianoQuest Live is a multimodal AI piano coach powered by Gemini's native audio model:

### Inputs
| Modality | Source | What It Captures |
|----------|--------|-----------------|
| **Audio** | Microphone | Piano sound, dynamics, rhythm, user voice |
| **MIDI** | USB keyboard (Web MIDI API) | Note-on/off, velocity, pedal, timing |
| **Voice** | Microphone | User goals, questions, reactions |

### Real-Time Visual Feedback
| Feature | Description |
|---------|-------------|
| **Grand Staff** | Scrolling music notation with proper clefs, accidentals, key signatures |
| **Waterfall Display** | Falling note bars color-coded by velocity |
| **Dynamic Bars** | Per-note velocity visualization across the piano range |
| **Virtual Keyboard** | 88-key display with active note highlighting |
| **Coaching Focus** | Technique tip card updated by Gemini via tool calls |
| **Conversation Panel** | Real-time transcription of both user and AI speech |

### Multi-Device Support
Multiple devices can join a session with assigned roles:
- **Primary** — MIDI + visualization (desktop with USB keyboard)
- **Mic** — Audio capture + speech recognition (tablet/phone near face)
- **Spectator** — Read-only view of the session

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **AI Model** | Gemini 2.5 Flash (native audio) via Live API |
| **SDK** | Google GenAI SDK (`@google/genai`) + Google ADK |
| **Backend** | TypeScript, Express, WebSocket streaming |
| **Frontend** | HTML/JS, Web Audio API, Web MIDI API, Canvas |
| **Deployment** | Google Cloud Run, Cloud Build |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Google Cloud API key with Gemini access
- MIDI keyboard (optional — works with audio-only too)

### Local Development

```bash
# Clone and install
git clone https://github.com/Jay-Network/PianoQuest-Live.git
cd PianoQuest-Live
npm install

# Set your API key
echo "GOOGLE_API_KEY=your-key-here" > .env

# Build and run
npx tsc && node dist/agent/server.js
```

Open http://localhost:8080 — allow microphone access. Connect a MIDI keyboard for full experience.

### Deploy to Cloud Run

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_API_KEY=your-key-here
```

---

## Project Structure

```
PianoQuest-Live/
├── src/agent/
│   ├── agent.ts       # ADK agent definition, tools, system instruction
│   └── server.ts      # Express + WebSocket server, Gemini Live session
├── static/
│   ├── index.html     # Full frontend (MIDI viz, grand staff, UI)
│   └── sheets/        # Reference sheet music (Fur Elise)
├── sheets/            # Digitized sheet music JSON (target notes)
├── docs/
│   ├── architecture.svg
│   └── demo-script.md
├── cloudbuild.yaml    # Cloud Build CI/CD
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## How It Works

1. **Browser** captures microphone audio + MIDI keyboard input
2. **WebSocket** streams 16kHz PCM audio and MIDI events to server
3. **Server** connects to Gemini Live API via `@google/genai` SDK
4. **Gemini 2.5 Flash** (native audio model) processes audio + MIDI context, generates voice coaching
5. **Gemini calls tools** (`set_coaching_focus`) to update the visual UI — tool events flow back through WebSocket
6. **Voice response** (24kHz PCM) streams back to browser for playback
7. **Canvas** renders grand staff notation, waterfall, dynamics, and keyboard in real time

The agent controls the coaching experience — Gemini decides when to give feedback and what to focus on through natural conversation, not scripted triggers.

---

## Competition Details

- **Challenge:** [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/)
- **Category:** Creative Storyteller
- **Cloud Run:** pianoquest-live (us-central1)

---

Copyright (c) 2026 JWorks. All rights reserved.

Built by Jay — MIT · STEM Educator
