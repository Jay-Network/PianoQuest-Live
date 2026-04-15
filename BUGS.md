# PianoQuest Live Bugs

## Open

(None)

## Resolved

### BUG-004: Path traversal in recording APIs (2026-04-15)
- **Symptom**: `/api/recordings/:filename` and recording dir param accepted `../` sequences, allowing read/write/delete of arbitrary files
- **Root cause**: `req.params.filename` and `req.query.dir` used directly in `path.join()` without sanitization
- **Fix**: Added `safeFilename()` that validates via `path.basename()`. Added directory confinement in `getRecDir()` — resolved path must be under `DEFAULT_RECORDINGS_DIR`.
- **Prevention**: Always sanitize user-provided filenames and constrain resolved paths to expected base directories.

### BUG-005: XSS via innerHTML with Gemini tool data (2026-04-15)
- **Symptom**: Achievement toasts and performance score cards used `innerHTML` with untrusted strings from Gemini tool calls (`data.achievement`, `data.detail`, `cat`)
- **Root cause**: Template concatenation into innerHTML instead of DOM API
- **Fix**: Replaced innerHTML with `document.createElement()` + `textContent` for all Gemini-sourced data
- **Prevention**: Never use innerHTML with data from external sources. Use textContent or DOM API.

### BUG-006: Malformed WebSocket JSON crashes session (2026-04-15)
- **Symptom**: A single malformed WebSocket message would crash the primary/secondary/spectator handler via uncaught JSON.parse exception
- **Root cause**: `JSON.parse(event.data)` in onmessage handlers had no try/catch
- **Fix**: Added try/catch around all 6 JSON.parse calls in WS handlers (4 frontend + 2 server)
- **Prevention**: Always wrap JSON.parse for external data in try/catch.

### BUG-003: Desktop bridge reconnect log spam (2026-04-14)
- **Symptom**: When PQ Desktop is offline, server logs "Desktop bridge disconnected, reconnecting in 30000ms" every 30 seconds, producing 2,880 log lines/day
- **Root cause**: Exponential backoff capped at 30s max. Once at cap, every reconnect attempt logged identically.
- **Fix**: Increased backoff cap from 30s to 5min (300000ms). Suppressed log output once delay exceeds 60s (status log still shows bridge state every 60s).
- **Prevention**: Long-running background reconnect loops should cap at minutes, not seconds, and suppress repetitive logs.

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
