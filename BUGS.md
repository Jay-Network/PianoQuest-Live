# PianoQuest Live Bugs

## Open

(None)

## Resolved

### BUG-001: Start Session fails with generic "error" (2026-03-28)
- **Symptom**: Clicking "Start Session" showed "error" status, session never connected
- **Root cause**: `handlePrimaryWebSocket` required successful Gemini Live API connection before creating the room. If Gemini connect failed (or was slow), the entire session was aborted — no room, no MIDI, nothing.
- **Fix**: Decoupled room creation from Gemini connection. Room is created immediately on WebSocket connect. Gemini is optional — if it fails, session continues for MIDI visualization with "Live Agent not available" status.
- **Prevention**: Session infrastructure (room, devices, MIDI) should never depend on external API availability.

### BUG-002: Server not running after Ubuntu restart (2026-03-28)
- **Symptom**: pianoquest.jayismocking.com showed 502 Bad Gateway
- **Root cause**: No systemd service — server only ran when manually started. Default port was 8080, not matching Cloudflare tunnel config (8090).
- **Fix**: Created `pianoquest-live.service` (systemd user service, enabled, Restart=always). Changed default port to 8090. Added `EnvironmentFile` for `.env` loading.
- **Prevention**: All persistent services must have systemd units with auto-restart.
