# Changelog

All notable changes to PianoQuest Live will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
