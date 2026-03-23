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

## App Scope — PQ Live vs PQ Desktop

| Responsibility | PQ Live | PQ Desktop |
|---------------|---------|------------|
| MIDI input (Web MIDI API) | Yes (direct, fallback) | Yes (primary source) |
| MIDI bridge streaming | Receives via `/ws/midi` | Sends via `:3490/ws` |
| MIDI recording/playback | No | Yes |
| Gemini AI coaching | Yes (sole owner) | No |
| Room/session management | Yes (sole owner) | No |
| Go Live / spectator broadcast | Yes (sole owner) | No |
| Remote viewer (spectator PWA) | Yes | No |
| Camera / MediaPipe | Yes | No |
| Agent terminal (tmux) | Yes | No |

**PQ Desktop** is a thin, always-on MIDI bridge + recorder:
1. Read USB MIDI keyboard
2. Stream raw MIDI events to PQ Live via `/ws` bridge
3. Record/playback MIDI sessions

**PQ Live** is the hub — AI coaching, rooms, live broadcast, visualization, remote viewers.

When both run on the same machine, PQ Live auto-detects the bridge and disables direct Web MIDI to prevent duplicate notes (BUG-047).

## Development

```bash
npm install
npx tsc          # compile TypeScript
npm start        # run server (requires GOOGLE_API_KEY or GEMINI_API_KEY)
```

## Version

See `VERSION` file. Bump on EVERY commit (VERSION, package.json, CHANGELOG.md, static/index.html header).

## Mandatory Rules (from Jay's feedback — DO NOT VIOLATE)

1. **Never deploy after every small change.** Batch all changes, deploy ONCE when Jay pauses or says "deploy now." Each deploy wastes ~3 minutes.
2. **Never auto-activate mic on secondary/phone devices.** Phone = camera only unless Jay explicitly says otherwise.
3. **Never auto-fullscreen anything.** Always provide a visible exit/close button. Never trap the user.
4. **When adding new device modes, verify existing modes still work.** Don't break phone camera when adding tablet mode.
5. **Log every bug in `docs/BUGS.md` immediately after fixing.** Don't wait to be told. Sequential IDs, root cause, fix, prevention.
6. **Tablet detection: `Math.min(width, height) > 768`**, never just `width`. Phones in landscape have width > 768.
7. **Version bump ALL files on every commit:** VERSION, package.json, CHANGELOG.md, and any UI headers showing version.
