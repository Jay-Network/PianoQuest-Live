# TODO — PianoQuest Live

## Active Tasks
(none)

## Investigated (needs Jay)
- pianoquest.live NXDOMAIN — domain not in Cloudflare, tunnel only routes pianoquest.jayismocking.com. Needs zone setup or redirect. Reported to jworks:20 (2026-04-10)

## Backlog
- Test all flows: mic → Gemini → audio, MIDI bridge, secondary camera, spectators (needs hardware/Jay present)
- Evaluate migration to gemini-3.1-flash-live-preview (2x conversation memory, 90+ languages, faster responses)
- Verify browser-side Gemini works with Start Coaching flow after merge
## Completed
- [x] v3.6.3: Fix cameraStaleTimer leak + geminiSession race condition on tool response (2026-04-16)
- [x] v3.6.2: Security fixes + hardening — path traversal, XSS, JSON.parse crash, duplicate middleware, bridge backoff, crypto import (2026-04-15)
- [x] v3.6.1: Fix dead imports, WS error handlers, Gemini key fetch UI, close BUG-015 (2026-04-14)
- [x] S1-PQ-1: 3 play modes (Journey/Compose/Jam) v3.6.0 — deployed, awaiting Jay browser verification (2026-04-14)
- [x] BUG-003: Fix bridge reconnect log spam — backoff cap 30s→5min (2026-04-14)
- [x] Resolve merge conflicts: dev-terminal + main → v3.5.1 (2026-04-07)
- [x] Update Gemini model to -latest alias, confirm sendClientContent is correct — v3.5.0 (2026-04-06)
- [x] Commit all uncommitted changes v3.2.53–v3.4.0 (2026-04-06)
- [x] Jazz Improv Practice Mode v3.4.0 — 5 lead sheets, chord display, session engine, scale waterfall, voicing highlights (2026-04-05)
- [x] Investigate scale/tempo controls bug on jayismocking.com/live — issue is website-side, PQ Live server already handles session_settings correctly. Sent fix details to jayhub:19 (2026-04-02)
- [x] Move Gemini Live session from server to browser (2026-03-29)
