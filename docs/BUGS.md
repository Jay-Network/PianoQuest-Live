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
