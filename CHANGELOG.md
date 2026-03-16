# Changelog

All notable changes to PianoQuest Live will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [2.0.1] - 2026-03-16

### Fixed
- **CRITICAL**: Grand staff missing — canvas had `height:100%` CSS but flex parent had zero height. Replaced with `sizeMidiStack()` that computes concrete pixel heights from midi-stack container (5:2.5:4 ratio for waterfall:keyboard:staff)

## [2.0.0] - 2026-03-16

### Changed
- **BREAKING**: Replaced @google/genai SDK `live.connect()` with ADK `agent.runLive()` + `LiveRequestQueue` (same proven pattern as JDialogs Copilot jworks:94)
- Audio/video/text now sent via `liveQueue.sendRealtime()` and `liveQueue.sendContent()` instead of `session.sendRealtimeInput()`
- Tool calls handled automatically by ADK (no manual `sendToolResponse`)
- Transcription events from ADK event stream (`event.inputTranscription`, `event.outputTranscription`, `event.turnComplete`)
- Removed `processGeminiMessage()` and `TranscriptState` (replaced by ADK event loop)

### Fixed
- Grand staff viewport: all canvases auto-size to fill browser window (flex 5:2.5:4)
- Grand staff vertical range: A0 at bottom, C8 at top — no wasted space
- Active note tails stay bright on finger release (was darkened for pedal-sustained)
- Removed stems from grand staff notes
- App fits in viewport: no scrolling

## [1.9.1] - 2026-03-16

### Fixed
- **CRITICAL**: Gemini not responding — added systemInstruction + speechConfig (voice: Puck) to live.connect config. Without system instruction Gemini had no reason to respond.
- Grand staff viewport: all 3 canvases (waterfall, keyboard, grand staff) now auto-size to fill browser window height using flex proportions (5:2.5:4)
- Grand staff vertical range: A0 at canvas bottom, C8 at canvas top — no wasted space
- Grand staff active note tails stay bright on finger release (was using darkenedColor for pedal-sustained)
- Removed stems from grand staff notes (no vertical sticks)
- App fits in viewport: html/body overflow hidden, no scrolling

### Changed
- Canvas heights derived from container rect.height instead of hardcoded values (560/520/344px)

## [1.9.0] - 2026-03-15

### Fixed
- Grand staff BPM: measure width no longer changes with tempo. Fixed to always show 4 measures in scrollable area. Higher BPM = faster scroll speed, not narrower measures.
- Derived `pxPerMs = measureWidthPx / measureDurationMs` instead of fixed `scrollWindow / scrollableW`

## [1.8.9] - 2026-03-15

### Fixed
- Treble clef too large: reduced from staffH*1.6 to staffH*1.05 (~35% smaller)
- Bass clef too high: removed upward offset (staffH*0.08), now centered directly on F3 line
- Bass clef size reduced from staffH*0.95 to staffH*0.72 for proper proportions

## [1.8.8] - 2026-03-15

### Fixed
- **CRITICAL**: Gemini audio responses were gated behind `turnHasUserSpeech` flag — audio buffered in `pendingAudioChunks` and never sent to client. Removed gate; audio now sent immediately.
- Transcript sending no longer gated on `turnHasUserSpeech` — always send on turnComplete/interrupted

### Added
- Diagnostic logging for Gemini message keys (non-audio messages logged for debugging)

## [1.8.7] - 2026-03-15

### Added
- Conversation panel with real-time speech transcription (user + Gemini messages)
- Chat CSS adopted from JDialogs Copilot (message bubbles, scroll, animations)
- `addMessage()` function for rendering chat messages with labels and timestamps
- `inputAudioTranscription` and `outputAudioTranscription` enabled in Gemini config

### Changed
- WebSocket handler now processes `input_transcript` and `output_transcript` messages

## [1.8.6] - 2026-03-15

### Changed
- Unified BPM: single slider controls both waterfall and grand staff tempo
- BPM slider, time signature, and scale selector moved to footer bar below midi stack
- Removed staff-controls sidebar from grand staff (was left sidebar with tiny inputs)
- BPM slider range extended to 40-300

### Removed
- BPM slider from header
- Tempo input from grand staff sidebar

## [1.8.5] - 2026-03-15

### Added
- Gemini speaking indicator with volume bar in header (shows Speaking/Silent + green volume fill)

### Fixed
- Grand staff clef placement: treble clef uses textBaseline='middle' at G4, bass clef at F3 with staffH-proportional font sizes
- Time signature: numbers centered between lines 3-5 (top) and 1-3 (bottom) using middle line as split

### Removed
- COACHING FOCUS panel from left sidebar

## [1.8.4] - 2026-03-15

### Fixed
- **CRITICAL**: Empty GOOGLE_API_KEY on Cloud Run — cloudbuild.yaml had `_API_KEY: ''`, now uses Secret Manager `google-api-key:latest`
- Grand staff clef placement: treble clef centered on G4 line, bass clef on F3 line (proper music notation)
- Grand staff time signature: top/bottom numbers centered in upper/lower halves of each staff
- Clef and time signature font sizes scale with lineSpacing

## [1.8.3] - 2026-03-15

### Fixed
- Waterfall: pedal-sustained notes no longer revert to bright on pedal release (close open history on re-trigger)
- Grand staff: note heads scroll left from play line at tempo speed (were stuck on play line)
- Grand staff: active notes always bright while sounding (were turning dark on finger release)
- Grand staff: pedal-sustained tail drawn dimmer, head stays bright

## [1.8.2] - 2026-03-15

### Fixed
- **CRITICAL**: Strip Gemini config to absolute minimum (responseModalities only) — no tools, no system instruction, no speech config, no transcription, no realtime input config
- Grand staff positioning: highest piano key (C8/MIDI 108) now at y=0, touching keyboard panel bottom

## [1.8.1] - 2026-03-15

### Fixed
- **CRITICAL**: Replace raw WebSocket to Gemini with @google/genai SDK `live.connect()` — raw WS was closing instantly; SDK works (confirmed by JayWalks, BookSage)
- Grand staff gap: position top treble line at ~15px from canvas top to eliminate gap below keyboard

### Changed
- Gemini Live connection now uses SDK callbacks (onopen, onmessage, onerror, onclose) instead of manual WebSocket protocol

## [1.8.0] - 2026-03-15

### Fixed
- **CRITICAL**: Gemini model name `gemini-2.5-flash-native-audio-latest` → `gemini-2.5-flash-native-audio-preview-12-2025` (latest alias doesn't exist)
- **CRITICAL**: Setup JSON snake_case → camelCase (generationConfig, responseModalities, etc.)
- **CRITICAL**: Duplicate JS variable declarations (sessionActive, currentScore) killed all JavaScript
- Grand staff gap: shifted center up (0.5→0.42) to minimize gap below keyboard
- Grand staff: past notes of same pitch no longer disappear when key pressed
- Fur Elise: proper treble/bass clef separation, correct 3/8 timing, accidentals

### Added
- B&W monotone color scheme matching jayismocking.com (designed by jworks:81 + jworks:97)
- Score panel draggable resize handle
- Score renderer: clef symbols, accidental marks (♯/♭), hollow noteheads for long notes
- Start/Stop merged into single toggle button
- MIDI dropdown auto-refreshes on focus

### Changed
- All panels 2x larger on desktop (waterfall 560px, grand staff 520px, dynamics 144px, keyboard 200px)
- Score panel widened to 560px
- App max-width 1920px
- Panel headers removed (Piano Roll, Keyboard, Grand Staff labels stripped)
- Grand staff controls moved to left sidebar
- Dynamic bars moved from piano roll to keyboard canvas

### Removed
- All amber/yellow colors — replaced with white accent
- Separate Stop button (merged into Start toggle)
- Panel header labels from midi stack

## [1.7.0] - 2026-03-15

### Added
- Score panel (right column): browse sheet music files, preview on mini grand staff
- Sheet music file system: `/sheets/` directory served statically, `/api/sheets` tree listing
- `sheets/classical/fur-elise.json` — Fur Elise opening measures as digital note data
- "Load as Target Notes" — sends score notes to waterfall + grand staff target system
- Color mode toggle: velocity-based coloring on sheet music notation
- Score canvas: mini grand staff renderer with treble/bass, stems, ledger lines

### Changed
- Layout: 3-column grid (left sidebar, center midi stack, right score panel)
- Keyboard panel moved above grand staff (dynamic bars grow upward from keyboard top)
- Dynamic bars removed from piano roll canvas, integrated into keyboard canvas
- Piano roll waterfall uses full canvas height

## [1.6.2] - 2026-03-15

### Fixed
- **CRITICAL**: Move `input_audio_transcription` and `output_audio_transcription` from `generation_config` to `setup` level in Gemini BidiGenerateContent setup message (caused instant close with code 1007)
- Grand staff play line moved to center (was at 12% from left)
- Active notes now elongate leftward while held, at tempo-matched speed (pxPerMs)
- Note history scrolls left at tempo-matched speed (same as measure bar flow)
- History notes show duration tails (rounded rectangles) proportional to hold time

## [1.6.1] - 2026-03-15

### Fixed
- **CRITICAL**: Replace @google/genai SDK `live.connect()` with raw WebSocket to Gemini BidiGenerateContent endpoint. SDK has a bug causing instant session close after setup. Raw WS works perfectly.
- Partition bar visibility on grand staff improved

## [1.6.0] - 2026-03-15

### Added
- Grand staff: tempo input, scale selector (19 keys), time signature selector (4/4, 3/4, 2/4, 6/8)
- Grand staff: key signature accidentals (sharps/flats) drawn on staff lines per selected scale
- Grand staff: time signature numbers displayed left of staff
- Grand staff: flowing measure bar lines scrolling right-to-left at tempo speed
- Grand staff: beat subdivision lines within measures
- Grand staff: play line (green) marking where notes should be played
- Grand staff: target notes system — hollow note heads flowing from right to play line
- Waterfall: target notes flowing down from top as outlined rectangles
- Practice curriculum framework in IDEAS.md (Stage 1: single finger)

### Changed
- Grand staff: played notes now appear at play line, history scrolls left (was: fixed position, history scrolled right)
- Grand staff: accidentals respect key signature (only shown for notes outside the key)
- Camera off by default — only activates when device receives camera role

## [1.5.2] - 2026-03-15

### Fixed
- Gemini model name: `gemini-2.5-flash-preview-native-audio-dialog` → `gemini-2.5-flash-native-audio-latest` (old name removed by Google, caused instant session close loop)
- Camera off by default — only activates on device with camera role assigned

### Added
- QR code button in room bar for easy secondary device onboarding
- `activateCamera()` function for role-based camera activation

## [1.5.1] - 2026-03-15

### Added
- Grand staff visualization between piano roll and keyboard
- Better Gemini Live session close/error logging for diagnostics

## [1.5.0] - 2026-03-15

### Removed
- Scoring & gamification: score display, quest journey map (5 phases), achievement badges (7 types), story scene cards (8 scenes)
- Tools: `set_scene`, `award_badge`, `advance_quest` — agent now uses only `set_coaching_focus` and `report_technique`
- All scene-specific CSS gradients and achievement popup animations

### Changed
- Device Manager: simplified from interactive toggle pills to read-only role tags
- System instruction: streamlined to reference only 2 tools, conversation-first coaching focus
- Frontend: cleaner UI focused on coaching panels, piano roll, and hand tracking

## [1.4.0] - 2026-03-15

### Added
- Dynamic Device Role Management: any device connects to unified `/ws/session` endpoint
  - First device becomes primary (creates Gemini session, shows full UI + Device Manager panel)
  - Subsequent devices join as secondary with `?room=CODE` parameter
  - Primary device gets Device Manager panel showing all connected devices with role tags
  - Three exclusive roles per device: MIC, CAM, MIDI — server-enforced, no overlap
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
