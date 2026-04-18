# Mistakes & Lessons — PianoQuest Live (jworks:120)

## Bridge reconnect backoff too aggressive (BUG-003, 2026-04-14)
**What happened:** Desktop bridge reconnect capped at 30s, producing 2,880 log lines/day when PQ Desktop was offline.
**Why:** Default backoff cap was chosen for quick reconnect, not for long-term offline resilience.
**Lesson:** Background reconnect loops for optional dependencies should cap at minutes (5min), not seconds. Suppress repetitive log lines after initial attempts — status log already covers the state.

## Unused imports left in server.ts (v3.6.1, 2026-04-14)
**What happened:** `crypto` and `execFile` imports were unused dead code in server.ts.
**Why:** Features were removed/refactored but imports weren't cleaned up.
**Lesson:** After removing code that uses an import, check if the import itself is still needed. TypeScript `--noUnusedLocals` could catch this if enabled.

## Missing ws.on("error") handlers (v3.6.1, 2026-04-14)
**What happened:** Bot terminal and MIDI bridge WebSocket connections had close handlers but no error handlers, risking resource leaks.
**Why:** Only the "close" event was considered during implementation. Error events were overlooked.
**Lesson:** Every `ws.on("close")` should be paired with `ws.on("error")` using the same cleanup logic. Check the spectator handler pattern as the gold standard.

## Gemini key fetch failure silent in UI (v3.6.1, 2026-04-14)
**What happened:** When `/api/gemini-key` fetch failed, the UI didn't update status — `sessionFlags.gemini` wasn't set to false, `updateStatusLabel()` wasn't called.
**Why:** The inner Gemini connect error path had proper UI updates, but the outer fetch error path was incomplete.
**Lesson:** Every error branch that prevents a feature from working must update the UI to reflect the failure. Don't assume only one error path exists.

## Path traversal in recording APIs (BUG-004, 2026-04-15)
**What happened:** `/api/recordings/:filename` accepted `../` sequences, allowing arbitrary file access.
**Why:** User-provided filenames were passed directly to `path.join()` without sanitization.
**Lesson:** Always use `path.basename()` on user-provided filenames. Validate resolved paths are within expected base directories. This is OWASP top 10 — check for it proactively.

## XSS via innerHTML with Gemini data (BUG-005, 2026-04-15)
**What happened:** Achievement toasts and score cards used `innerHTML` with untrusted Gemini tool call data.
**Why:** Template string concatenation into innerHTML felt quick and easy.
**Lesson:** Never use `innerHTML` with data from external sources (Gemini, WebSocket, user input). Use `textContent` or DOM API (`createElement` + `textContent`).

## Server-side Gemini twitching was architecture, not config (BUG-015)
**What happened:** Spent time stripping Gemini config to minimum in v1.8.x trying to fix connection twitching. The real fix was the v3.3.0 architecture change (Gemini moved to browser).
**Why:** Assumed the issue was config-level when it was caused by the server-side WebSocket relay complexity.
**Lesson:** If 3+ config-level fixes fail for a connection stability issue, question the architecture. The relay layer itself may be the problem.
