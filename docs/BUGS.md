# PianoQuest Live — Bug Tracker

## Format
Each bug: ID, version found, severity, status, root cause, fix, prevention.

---

## BUG-001
- Version found: `0.4.0`
- Severity: High
- Status: Fixed
- Root cause: Browser sent periodic `midi_snapshot` messages even when no notes or pedal activity existed. Backend treated those idle snapshots as fresh user turns, interrupting Gemini mid-response and causing repeated restart phrases such as "Welcome to the enchanted..."
- Fix: Frontend now sends MIDI snapshots only when there is real note/pedal activity, and backend ignores empty snapshots.
- Prevention: Never turn passive visualization state into conversational turns. Gate all agent-facing MIDI summaries behind meaningful performance activity.

## BUG-002
- Version found: `0.4.0`
- Severity: High
- Status: Fixed
- Root cause: After switching piano analysis to MIDI, the microphone capture path was still configured for raw music intake (`echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`). That made Gemini more likely to hear its own playback/room bleed and less likely to respond reliably to spoken input.
- Fix: Speech microphone capture is now optimized for conversation with echo cancellation, noise suppression, auto gain control, and mono input.
- Prevention: Keep browser audio constraints aligned with the actual modality split. If piano analysis is MIDI-first, microphone settings must be speech-first.

## BUG-003
- Version found: `0.4.1`
- Severity: High
- Status: Fixed
- Root cause: Even after speech-optimized mic constraints, the browser continued streaming microphone frames while Gemini audio was playing. Playback bleed triggered live-session interruptions, causing Gemini to get chopped off every few seconds and resume from roughly the same point.
- Fix: Browser now gates outgoing microphone PCM while agent playback is active, with a short post-playback hold window.
- Prevention: In full-duplex live voice apps, treat output playback as a first-class signal in the input pipeline. Do not stream mic audio to the model while model audio is actively playing unless true echo cancellation has been verified.

## BUG-004
- Version found: `0.4.2`
- Severity: High
- Status: Fixed
- Root cause: The UI had no explicit in-app camera control or visible hand-tracking confirmation, so the agent could continue making visual claims without giving the user a reliable way to disable the camera or verify what the model could actually see.
- Fix: Added an in-UI camera toggle and a live hand-skeleton overlay with camera status badges so visual sensing is explicit and user-controlled.
- Prevention: Any feature that drives model-side visual claims must expose both a user-facing kill switch and an on-screen indication of what is actually being tracked.

## BUG-005
- Version found: `0.4.2`
- Severity: High
- Status: Fixed
- Root cause: The live agent prompt allowed finger-specific coaching whenever camera input existed, even if only one hand or no hands were actually detected.
- Fix: Frontend now sends hand-detection state, backend forwards that state into the live session, and the agent instructions now forbid finger/fingering comments or `report_technique` unless both hands are detected.
- Prevention: Visual coaching prompts must be gated by concrete detection state, not just by camera availability.

## BUG-006
- Version found: `0.4.3`
- Severity: High
- Status: Fixed
- Root cause: Startup `camera_state` and `hand_state` messages were being forwarded into Gemini as standalone user turns. Those extra turns interrupted the opening response, so the model restarted its greeting multiple times.
- Fix: Camera and hand-detection updates are now stored as session state on the server and merged into the next meaningful MIDI performance update instead of being sent as separate turns.
- Prevention: Session-state telemetry must not be forwarded to a live conversational model as its own user turn unless an interruption is explicitly intended.

## BUG-007
- Version found: `0.4.4`
- Severity: Medium
- Status: Fixed
- Root cause: The new camera toggle button was only enabled on startup failure, not on the normal successful WebSocket/session startup path.
- Fix: The camera toggle is now enabled as soon as the session WebSocket opens successfully.
- Prevention: Interactive controls added for in-session use must be enabled in the success path first, then selectively disabled only on teardown or fatal startup failure.
