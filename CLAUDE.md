# PianoQuest Live

**Competition:** Gemini Live Agent Challenge (deadline March 16, 2026)
**Category:** Creative Storyteller (video + audio + voice + MIDI visualization)
**GCP Project:** jworks-interpreter-challenge
**Cloud Run Service:** pianoquest-live

## Concept

Interactive musical storytelling where the user's piano playing drives an AI narrative.
The agent listens to piano audio, watches hands via camera, reads MIDI data, and coaches
the user through natural voice conversation with real-time visual feedback.

## Architecture

- **Backend:** TypeScript (Google ADK + Express + WebSocket)
- **Frontend:** HTML/JS with Web Audio API + Web MIDI API + MediaPipe HandLandmarker
- **Deployment:** Google Cloud Run via Cloud Build
- **API:** Gemini Live API (native audio model) via @google/genai SDK

### Multimodal Input Pipeline

```
Phone (secondary)                Desktop (primary)
├── Camera → JPEG 1fps ──┐      ├── MIDI USB keyboard ──┐
├── MediaPipe hands ─────┤      │                       │
└── Mic audio (PCM) ─────┤      │                       │
                         ▼      │                       ▼
                    WebSocket (/ws/session)          WebSocket
                         │                              │
                         ▼                              ▼
                   Express Server (server.ts)
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         Gemini Live   Broadcast   Spectators
         (audio+video  to room     (/ws/spectator)
          +MIDI text)  devices
```

### Key Files

| File | Purpose |
|------|---------|
| `src/agent/server.ts` | Express + WebSocket server, device management, room sessions, Gemini Live connection |
| `src/agent/agent.ts` | System instruction, tool declarations (set_coaching_focus, report_technique), ADK agent definition |
| `static/index.html` | All frontend: primary UI, secondary device mode, spectator mode, MediaPipe hand tracking |
| `src/index.ts` | Entry point |

### Tools

| Tool | Purpose |
|------|---------|
| `set_coaching_focus` | Update the coaching focus card with an actionable tip |
| `report_technique` | Report a correlated vision (EYE) + audio (EAR) technique observation |

### Device Roles

| Role | Device | Function |
|------|--------|----------|
| `mic` | Any | Sends PCM audio to Gemini |
| `camera` | Phone (secondary) | Sends JPEG frames to Gemini, runs MediaPipe hand skeleton |
| `midi` | Desktop (primary) | Sends MIDI events + snapshots |

## Development

```bash
npm install
npx tsc          # compile TypeScript
npm start        # run server (requires GOOGLE_API_KEY or GEMINI_API_KEY)
```

## Version

See `VERSION` file. Bump on EVERY commit (VERSION, package.json, CHANGELOG.md, static/index.html header).
