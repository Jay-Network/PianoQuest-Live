# TODO — PianoQuest Live

## Active Tasks
- [ ] Test all flows: mic → Gemini → audio, MIDI bridge, secondary camera, spectators (2026-03-29)
- [ ] Migrate sendClientContent → sendRealtimeInput for newer @google/genai SDK (from jworks:13)
- [ ] Update Gemini model from preview-12-2025 to -latest (S-105 flagged stale model — verify alias works first)
- [ ] Commit all uncommitted changes (v3.3.0 browser migration + v3.4.0 jazz improv)

## Completed
- [x] Jazz Improv Practice Mode v3.4.0 — 5 lead sheets, chord display, session engine, scale waterfall, voicing highlights (2026-04-05)
- [x] Investigate scale/tempo controls bug on jayismocking.com/live — issue is website-side, PQ Live server already handles session_settings correctly. Sent fix details to jayhub:19 (2026-04-02)
- [x] Move Gemini Live session from server to browser (2026-03-29)
  - [x] Add GET /api/gemini-key endpoint to server
  - [x] Add server handlers for browser Gemini forwarding
  - [x] Modify flushMidiToGemini to send midi_for_gemini to primary browser
  - [x] Forward secondary mic audio to primary browser
  - [x] Remove Gemini SDK and session from server
  - [x] Load @google/genai SDK in browser via CDN
  - [x] Embed agent constants in browser JS
  - [x] Create connectGemini() in browser
  - [x] Rewire mic/camera/MIDI/text to browser Gemini session
  - [x] Forward Gemini events to server for spectator broadcast
  - [x] Version bump to 3.3.0, update CLAUDE.md architecture
- [x] Add m7b5 chord template — v3.2.95 (2026-03-29)
- [x] Replace time-windowed chord detection with debounce — v3.2.94 (2026-03-29)
- [x] Balanced scoring (templateFit+coverage)/2 for chord detection — v3.2.93 (2026-03-29)
- [x] Tighter chord matching: require minMatch = max(2, intervals-1) — v3.2.92 (2026-03-29)
