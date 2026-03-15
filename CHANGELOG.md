# Changelog

All notable changes to PianoQuest Live will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [1.4.0] - 2026-03-15

### Added
- Dynamic Device Role Management: any device connects to unified `/ws/session` endpoint
  - First device becomes primary (creates Gemini session, shows full UI + Device Manager panel)
  - Subsequent devices join as secondary with `?room=CODE` parameter
  - Primary device gets Device Manager panel showing all connected devices with toggle pills
  - Three exclusive roles per device: MIC, CAM, MIDI — toggled by primary, server-enforced
  - Toggling a role on one device auto-disables it on all others (no overlap)
  - Secondary devices show minimal role-indicator UI, activate hardware on role assignment
  - Secondary mic: getUserMedia audio with energy gate, downsample to 16kHz PCM
  - Secondary camera: rear-facing camera, 1fps JPEG frames to Gemini
  - Secondary MIDI: Web MIDI API forwarding to Gemini + room devices
  - All devices receive audio playback + output events from Gemini
- Room code "Copy Link" button for easy device onboarding
- Auto-detect device type from User-Agent (desktop/tablet/phone) with icons
- Role hint via URL parameter: `?room=CODE&role=camera` auto-assigns role on connect
- `room_closed` message to gracefully disconnect secondaries when primary leaves
- Backwards compatible: `/ws/dialog`, `/ws/camera`, `/ws/midi`, `/ws/spectator` still work

## [1.3.1] - 2026-03-15

### Fixed
- Mic audio energy gate: skip silent chunks (RMS < 0.01) so Gemini's automatic activity detection triggers end-of-speech correctly (cross-app fix from BookSage)

## [1.3.0] - 2026-03-15

### Added
- 3-device demo architecture: Ubuntu (MIDI) + iPad (primary UI) + iPhone (camera)
  - `/ws/midi?room=CODE` WebSocket path for MIDI bridge connections
  - Server buffers MIDI events and flushes to Gemini as snapshots every 2 seconds
  - Server forwards raw MIDI events to iPad for waterfall/dynamics visualization
  - iPad handles incoming `midi` messages from WebSocket for remote MIDI rendering
- `scripts/midi-relay.js` — relay script connecting pianoquest-bridge (:3491) to Cloud Run
- Room session now includes `sendClientContent` and `primaryWs` for cross-device data routing

## [1.2.0] - 2026-03-15

### Added
- Remote camera mode: phone at piano sends camera frames to iPad's Gemini session
  - `/ws/camera?room=CODE` WebSocket path for camera-only connections
  - Room-based session sharing: primary client gets a 4-char room code on connect
  - `?camera=1&room=CODE` on index.html: minimal camera viewfinder UI, rear-facing camera, 1fps JPEG
  - Room code displayed in primary client status bar
- Health endpoint shows active room count

## [1.1.0] - 2026-03-14

### Added
- Spectator mode: connect to `?spectator=1` to watch a live session from another device
  - New `/ws/spectator` WebSocket path receives all output (audio, tool events, transcripts)
  - Spectator UI hides camera/mic controls, auto-connects, plays audio and shows all visual panels
  - Primary session broadcasts all Gemini output to connected spectators
- Health endpoint now shows spectator count

## [1.0.1] - 2026-03-14

### Fixed
- Removed bothHandsDetected guard from showTechniqueReport() — trust model judgment, prevent report swallowing during brief tracking drops
- Mic audio quality: capture at native sample rate and downsample to 16kHz (cross-app fix from JayWalks Live)

### Changed
- Conversation-first system prompt: shorter responses (1-2 sentences), natural flow, tools used sparingly
- Updated demo script for v1.0.0 architecture

## [1.0.0] - 2026-03-12

### Changed
- **BREAKING**: Migrated entire backend from Python (FastAPI + ADK Python) to TypeScript (Express + ws + @google/genai)
  - Runtime: Python 3.11 → Node.js 20
  - Server: FastAPI WebSocket → Express + `ws` library
  - AI: ADK `Runner.run_live()` → `@google/genai` `client.live.connect()` (ADK TS v0.5 lacks `runLive`)
  - Tools: Python functions with `contextvars` → manual `functionDeclarations` + local execution
  - Dockerfile: python:3.11-slim → node:20-slim
- All 5 tools preserved: set_scene, award_badge, set_coaching_focus, advance_quest, report_technique
- WebSocket protocol unchanged — frontend (static/index.html) requires no changes
- System instruction preserved verbatim

### Added
- `src/index.ts` — entry point
- `src/agent/agent.ts` — tool definitions, system instruction, ADK LlmAgent (structural)
- `src/agent/server.ts` — Express + WebSocket + Gemini Live API integration
- `package.json`, `tsconfig.json` — TypeScript project config
- ADK FunctionTool definitions with Zod schemas (for future `runLive` support)

### Removed
- `agent/agent.py`, `agent/server.py`, `agent/__init__.py`, `agent/__main__.py`
- `requirements.txt`

## [0.4.7] - 2026-03-12

### Added
- `report_technique` tool for vision-audio correlation reporting
- Finger Tracking UI panel

### Changed
- Increased video frame rate from every 2 seconds to every 1 second

## [0.4.0] - 2026-03-11

### Changed
- **BREAKING**: Replaced frontend keyword matching with genuine ADK tool calls
  - Agent now calls `set_scene()`, `award_badge()`, `set_coaching_focus()`, `advance_quest()` tools
  - Gemini DECIDES when to trigger visual changes — not frontend string matching
  - Visual events flow: Gemini → tool call → contextvars queue → WebSocket → frontend
- Removed `google_search` tool (unused), replaced with 4 visual control tools
- Rewrote agent prompt to instruct tool usage patterns throughout session arc
- Frontend handles tool-driven WebSocket messages instead of parsing transcripts

### Removed
- `detectScene()`, `detectAchievement()`, `detectQuestPhase()`, `detectCoachingTip()` keyword functions
- `QUEST_KEYWORDS` array
- Scene vocabulary and achievement phrase sections from prompt (replaced by tool docs)

## [0.3.0] - 2026-03-11

### Added
- Story Scene Cards: 8 themed visual environments driven by narrative
- Coaching Focus Card: technique tips parsed from agent speech
- Achievement Badges: 7 animated milestone popups
- Quest Journey Map: 5-phase narrative arc visualization
- Technique Score: composite dynamics + rhythm accuracy score (0-100)
- Score trend indicator (up/down arrows)
- Full dark theme with architecture diagram color palette

## [0.2.0] - 2026-03-11

### Added
- Blog post for Gemini Live Agent Challenge (`docs/blog-post.md`) covering 3x8 multimodal architecture
- Full piano coaching + creative storyteller agent prompt (multimodal aware: vision + audio + voice)
- Camera capture: sends JPEG frames to Gemini vision every 2s for finger/technique analysis
- Audio capture: 16kHz PCM streaming to Gemini for piano + voice recognition
- Audio playback: 24kHz PCM agent voice output with gapless scheduling
- MIDI Dynamic Bars visualization: 48-band frequency analysis with piano-range mapping
- Rhythm Accuracy Grid: onset detection + BPM-aligned grid with color-coded timing accuracy
- Level meter: real-time audio input level display
- Full dark theme UI matching architecture diagram color palette
- Video frame handling in WebSocket server (base64 JPEG → Gemini Live API)

### Changed
- Agent voice from Aoede to Puck (warmer, more narrative)
- Agent prompt from generic storyteller to piano coaching + creative storytelling hybrid

## [0.1.0] - 2026-03-11

### Added
- Initial project scaffolding
- ADK agent with Creative Storyteller mode
- FastAPI + WebSocket server (same pattern as JDialogs Copilot)
- Placeholder UI
- Cloud Run deployment scripts
- Version control files (VERSION, CHANGELOG, BUGS, IDEAS)
