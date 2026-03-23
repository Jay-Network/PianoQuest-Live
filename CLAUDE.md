# PianoQuest Live

**Competition:** Gemini Live Agent Challenge (deadline March 16, 2026)
**Category:** Creative Storyteller (video + audio + voice + MIDI visualization)
**GCP Project:** jworks-interpreter-challenge
**Cloud Run Service:** pianoquest-live

## Concept

Interactive musical storytelling where the user's piano playing drives an AI narrative.
The agent listens to piano audio, watches hands via camera, reads MIDI data, and coaches
the user through natural voice conversation with real-time visual feedback.

## Primary Flow (no browser needed)

```
Piano (CASIO USB) → PQ Desktop (always on) → PQ Live server (systemd) → iPad / jayismocking.com/live
```

**PQ Desktop is the primary app.** It's always running on Ubuntu.
**PQ Live server** runs as a systemd service (`pianoquest-terminal.service`) in the background.
**PQ Live browser** (pianoquest.jayismocking.com) is **optional** — only for coaching or brother's access.

The server-side MIDI bridge connects PQ Live server → PQ Desktop :3490/ws automatically.
A persistent "HOME" room is created on server startup and is always live.
No browser, no clicks, no manual steps.

## Architecture

- **Backend:** TypeScript (Google ADK + Express + WebSocket)
- **Frontend:** HTML/JS with Web Audio API + Web MIDI API + MediaPipe HandLandmarker
- **Deployment:** Google Cloud Run via Cloud Build (hackathon branch), systemd locally (dev-terminal)
- **API:** Gemini Live API (native audio model) via @google/genai SDK

### Signal Flow

```
Piano (CASIO USB)
    │
    ▼
PQ Desktop (:3490/ws)          Browser (optional)
    │                           ├── Web MIDI (fallback)
    │                           ├── Camera/MediaPipe
    │                           └── Mic → Gemini coaching
    ▼                               │
PQ Live server (systemd :8090)  ◄───┘
    │
    ├── HOME room (persistent, auto-live)
    ├── /ws/spectator → iPad (PQ Remote)
    └── /ws/spectator → jayismocking.com/live (PQ Stream)
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

## App Scope — PQ Desktop vs PQ Live

**PQ Desktop is the primary app. PQ Live browser is optional.**

| Responsibility | PQ Desktop | PQ Live server | PQ Live browser |
|---------------|------------|----------------|-----------------|
| MIDI input (USB keyboard) | **Primary source** | — | Fallback (Web MIDI) |
| MIDI bridge | Serves on `:3490/ws` | Connects as client | — |
| MIDI recording/playback | Yes | No | No |
| Waterfall visualization | Yes | — | Yes |
| Room management | No | Yes (HOME room, persistent) | — |
| Spectator broadcast | No | Yes (auto-live) | — |
| Gemini AI coaching | No | — | Yes (optional) |
| Camera / MediaPipe | No | — | Yes (optional) |
| Agent terminal (tmux) | No | — | Yes (admin) |

### What runs where

| Component | How it runs | Required? |
|-----------|------------|-----------|
| PQ Desktop | Kotlin app on Ubuntu | **Yes — always on** |
| PQ Live server | `systemctl --user start pianoquest-terminal` | **Yes — always on** |
| PQ Live browser | pianoquest.jayismocking.com | **No — optional** |
| PQ Remote | iPad PWA (spectator) | No — optional viewer |
| PQ Stream | jayismocking.com/live | No — public viewer |

### Status monitoring

- `GET /health` — lightweight health check
- `GET /status` — detailed system status (bridge, room, Gemini, spectators)
- Console logs health summary every 60s
- See `docs/STATUS-TRACKING.md` for details

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
