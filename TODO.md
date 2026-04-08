# TODO — PianoQuest Live

## Active Tasks
(none)

## Backlog
- Test all flows: mic → Gemini → audio, MIDI bridge, secondary camera, spectators (needs hardware/Jay present)
- Evaluate migration to gemini-3.1-flash-live-preview (2x conversation memory, 90+ languages, faster responses)
- Verify browser-side Gemini works with Start Coaching flow after merge
- BUG-015 status: Gemini connection twitching — marked investigating, may be resolved after browser-side Gemini move

## Completed
- [x] Resolve merge conflicts: dev-terminal + main → v3.5.1 (2026-04-07)
- [x] Update Gemini model to -latest alias, confirm sendClientContent is correct — v3.5.0 (2026-04-06)
- [x] Commit all uncommitted changes v3.2.53–v3.4.0 (2026-04-06)
- [x] Jazz Improv Practice Mode v3.4.0 — 5 lead sheets, chord display, session engine, scale waterfall, voicing highlights (2026-04-05)
- [x] Investigate scale/tempo controls bug on jayismocking.com/live — issue is website-side, PQ Live server already handles session_settings correctly. Sent fix details to jayhub:19 (2026-04-02)
- [x] Move Gemini Live session from server to browser (2026-03-29)
