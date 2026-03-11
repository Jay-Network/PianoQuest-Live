# Changelog

All notable changes to PianoQuest Live will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
