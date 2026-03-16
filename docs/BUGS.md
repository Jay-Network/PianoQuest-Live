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

## BUG-008
- Version found: `0.4.5`
- Severity: High
- Status: Fixed
- Root cause: The live session could emit spoken replies for non-speech turns, including startup state changes and MIDI-only context, which made Gemini greet or comment without being verbally addressed.
- Fix: Server now suppresses audio and transcript output unless the current turn contains actual user speech transcription, and the agent prompt explicitly says not to speak first.
- Prevention: In a speech-driven UX, only turns with verified spoken user input should be allowed to reach audio playback.

## BUG-009
- Version found: `1.8.0`
- Severity: Critical
- Status: Fixed (v1.8.1)
- Root cause: Raw WebSocket to Gemini BidiGenerateContent endpoint closed instantly after setup. Multiple fixes attempted (model name, camelCase, field placement) but raw WS approach was fundamentally broken.
- Fix: Replaced raw WebSocket with @google/genai SDK `live.connect()` — confirmed working by sibling agents (JayWalks, BookSage).
- Prevention: Use the SDK. Don't bypass it unless there's a confirmed, reproducible SDK bug with a test case.

## BUG-010
- Version found: `1.8.0`
- Severity: Critical
- Status: Fixed (v1.8.0)
- Root cause: Duplicate JS variable declarations — `sessionActive` (let + var) and `currentScore` (let + var) — killed ALL JavaScript execution in the frontend.
- Fix: Removed duplicate declarations.
- Prevention: Never declare the same variable twice. Use `let` or `const` consistently.

## BUG-011
- Version found: `1.8.0`
- Severity: Medium
- Status: Fixed (v1.8.0)
- Root cause: Grand staff `activeNotes.has(entry.note)` hid ALL history entries for the same pitch when key pressed, not just the currently active one.
- Fix: Changed condition to `entry.endMs === 0` to only match currently-active entries.
- Prevention: Don't use pitch-only matching for note identity when history contains multiple entries for the same pitch.

## BUG-012
- Version found: `1.8.2`
- Severity: Medium
- Status: Fixed (v1.8.2)
- Root cause: Waterfall bars for pedal-sustained notes revert to bright (finger-pressed) color on pedal release. When a note is re-triggered while pedal-sustained, the old noteHistory entry never gets its endMs set — `pedalSustainedNotes.delete()` on re-trigger prevents the pedal-release handler from finding it.
- Fix: `handleNoteOn` now closes any open history entries for the same note before creating a new one.
- Prevention: Always close previous note history entries when re-triggering the same note.

## BUG-013
- Version found: `1.8.2`
- Severity: Medium
- Status: Fixed (v1.8.3)
- Root cause: Grand staff active notes always bright regardless of finger/pedal state. User wants active notes always bright while sounding, but pedal-sustained tail drawn dimmer.
- Fix: Active notes always use `dynamicsColor` (bright). Pedal-sustained tail uses `darkenedColor`. Head stays bright.

## BUG-014
- Version found: `1.8.2`
- Severity: Medium
- Status: Fixed (v1.8.3)
- Root cause: Grand staff note heads stayed fixed at play line instead of scrolling left. When released, they disappeared from active but the transition to history was jarring.
- Fix: Note heads now scroll left from play line at tempo speed, with tail extending to play line. History notes continue scrolling naturally.

## BUG-016
- Version found: `1.8.2`
- Severity: Medium
- Status: Fixed (v1.8.3)
- Root cause: Grand staff active notes turned dark immediately on finger release (even while pedal sustained). Used `fingerDownNotes.has(midi)` to determine color.
- Fix: Active notes always rendered bright. Pedal-only distinction shown in tail color only, not head color.

## BUG-015
- Version found: `1.8.1`
- Severity: Critical
- Status: Investigating
- Root cause: Gemini connection still twitching between connected/disconnected even with SDK live.connect(). Stripped to minimal config in v1.8.2.
- Fix: TBD — stripped config to absolute minimum (responseModalities only). If still failing, need to check API key, model availability, or network issues.

## BUG-017
- Version found: `2.0.3`
- Severity: High
- Status: Fixed (v2.1.0)
- Root cause: Gemini `inputAudioTranscription` outputs wrong languages (Arabic, Korean) — known unfixable API bug on native audio model.
- Fix: Removed `inputAudioTranscription` from Gemini config. Added browser Web Speech API (`SpeechRecognition`) as replacement for user input transcription.
- Prevention: Don't rely on Gemini's input transcription for native audio models. Use browser-side speech recognition.

## BUG-018
- Version found: `2.0.3`
- Severity: High
- Status: Fixed (v2.1.0)
- Root cause: Output transcription showed only last few words because code replaced buffer (`bufOutput = text`) instead of appending.
- Fix: Changed to `bufOutput += (bufOutput ? " " : "") + text` to accumulate full sentences.
- Prevention: Transcription chunks are partial — always append, never replace.

## BUG-019
- Version found: `2.1.0`
- Severity: High
- Status: Fixed (v2.1.1)
- Root cause: Gemini responds "that sounds really expressive" to user speech, thinking they played piano. Cannot distinguish voice from piano audio in the same stream.
- Fix: Updated system instruction to explicitly describe two audio signal types (voice vs piano) and require MIDI data before commenting on playing.
- Prevention: Always clarify input modality expectations in system instruction when multiple audio sources share one stream.

## BUG-020
- Version found: `2.1.0`
- Severity: High
- Status: Fixed (v2.1.1)
- Root cause: Grand staff note tails go dark immediately on finger release. History drawing used flat alpha fade without distinguishing finger-held vs pedal-sustained segments (unlike waterfall which has separate headColor/pedalColor).
- Fix: Grand staff history now draws two segments — finger-held (bright) and pedal-sustained (dimmer) — matching waterfall behavior.
- Prevention: Keep visual rendering rules identical between waterfall and grand staff.

## BUG-021
- Version found: `2.1.1`
- Severity: Medium
- Status: Fixed (v2.1.2)
- Root cause: Left panel resize handle placed inside left-col with `overflow: hidden`, making it invisible and non-functional.
- Fix: Restructured resize handles as dedicated grid columns between panels instead of absolute-positioned elements inside overflow-hidden containers.
- Prevention: Never place interactive handles inside overflow:hidden containers.

## BUG-022
- Version found: `2.1.0`
- Severity: Medium
- Status: Fixed (v2.1.3)
- Root cause: Grand staff clefs overlapped time signature — clefW (24px) too narrow for rendered glyph size.
- Fix: Widened clef area 24→32px and time sig zone 16→18px.
- Prevention: Size margin zones based on actual glyph rendering, not assumptions.

## BUG-023
- Version found: `2.1.0`
- Severity: Low
- Status: Fixed (v2.1.4)
- Root cause: Pistachio green for mezzo piano (mp) looked out of place in the dynamics color palette. Rainbow color scheme (blue→cyan→green→yellow→orange→red→pink→purple) had no visual coherence.
- Fix: Replaced with cool blue→white temperature ramp (Option B from jworks:81 design team).
- Prevention: Get design review before shipping color palettes.

## BUG-024
- Version found: `2.1.4`
- Severity: Medium
- Status: Fixed (v2.1.5)
- Root cause: Option B dynamics colors too desaturated — at normal playing velocities (60-100), colors looked near-white/monochrome, indistinguishable from Option A.
- Fix: Increased blue channel saturation across the gradient. Low velocities now clearly deep blue, mid-range sky blue, high velocities near-white.
- Prevention: Test color palettes at typical velocity ranges, not just extremes.
