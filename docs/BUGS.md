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

## BUG-025
- Version found: `2.1.21`
- Severity: Medium
- Status: Fixed (v2.1.21)
- Root cause: Grand staff finger-held segments rendered hollow (same as pedal-sustained), not matching waterfall's filled inner gradient style.
- Fix: Applied waterfall's gradient pattern (0.9 alpha edges, 0.7 center, 1px edge highlights) to grand staff finger-held segments in both initial draw and redraw sections.
- Prevention: Keep visual rendering rules identical between waterfall and grand staff.

## BUG-026
- Version found: `2.1.21`
- Severity: Medium
- Status: Fixed (v2.1.22)
- Root cause: Individual note accidentals (#/b) too small and hard to read on the glass bars.
- Fix: Changed to bold white 22px serif font, centered on the note bar at noteX-14.
- Prevention: Music notation symbols need to be large enough to read at performance speed.

## BUG-027
- Version found: `2.1.22`
- Severity: Medium
- Status: Fixed (v2.1.23)
- Root cause: Key signature accidentals (shown when scale selected) too small — same size as individual note accidentals.
- Fix: Made key signature accidentals 3x larger (33px bold white), positioned right of time signature numbers with 22px spacing.
- Prevention: Key signature is a persistent display element — needs to be clearly visible at all times.

## BUG-028
- Version found: `2.1.28`
- Severity: Critical
- Status: Fixed (v2.1.28)
- Root cause: `document.getElementById('staffKeySig')` returned null — correct ID is `staffScale`. Null `.value` threw TypeError that killed the entire render loop, causing page to hang with no animation.
- Fix: Changed to `document.getElementById('staffScale')`.
- Prevention: Never reference DOM IDs without verifying they exist. Clef/notation code must never crash the render loop.

## BUG-029
- Version found: `2.1.29`
- Severity: Low
- Status: Fixed (v2.1.29)
- Root cause: Grand staff clef redraw section (~line 2196) used hardcoded positions `(4, trebleG4Y)` and `(6, bassClefY)`, overriding the computed `trebleClefX` and offset values from the initial draw. Clef position changes appeared to have no effect.
- Fix: Redraw section now uses `trebleClefX` and `trebleG4Y - trebleLineSpacing * 0.85` matching the initial draw.
- Prevention: When grand staff has dual-draw (initial + redraw after history), both must use the same computed coordinates.

## BUG-030
- Version found: `2.1.30`
- Severity: Medium
- Status: Fixed (v2.1.31)
- Root cause: Pressing a single black key caused bright glowing rims around every black key. `ctx.shadowBlur = 10` set for the active key was never reset, bleeding to all subsequent black key fillRect calls.
- Fix: Added `ctx.shadowBlur = 0` after each black key fillRect.
- Prevention: Always reset ctx.shadowBlur to 0 after any element that uses it.

## BUG-031
- Version found: `2.1.30`
- Severity: Low
- Status: Fixed (v2.1.32)
- Root cause: Grand staff horizontal lines only extended from clefW, not from the left edge of the panel. Both initial and redraw sections used `clefW` as the starting X.
- Fix: Changed `ctx.moveTo(0, y)` in both initial draw and redraw sections.
- Prevention: Staff lines should always span full panel width.

## BUG-032
- Version found: `2.1.33`
- Severity: Medium
- Status: Fixed (v2.1.34)
- Root cause: Scale-aware keyboard initially made in-scale black keys #181818 (lighter than normal #111), which looked "grayed out" — the opposite of intended. Non-diatonic keys appeared normal while diatonic keys looked dimmed.
- Fix: In-scale black keys use #111 (normal black), non-scale black keys use #444 (visibly grey/dimmed). Small blue dot indicator on in-scale keys.
- Prevention: Brighter = more prominent. Diatonic keys should look normal/default; non-diatonic should be visibly muted.

## BUG-033
- Version found: `2.1.30`
- Severity: High
- Status: Fixed (v2.1.30)
- Root cause: Deploy v2.1.30 failed silently due to gzip race condition from overlapping background deploys. Jay saw v2.1.29 still live.
- Fix: Resubmitted deploy after previous build completed.
- Prevention: Never run overlapping Cloud Build deploys. Wait for one to finish before starting another.

## BUG-034
- Version found: `2.1.21–2.1.37`
- Severity: High
- Status: Fixed (v2.1.37)
- Root cause: Multiple code changes made without bumping VERSION, package.json, CHANGELOG.md, and index.html header. Jay couldn't tell if deploys succeeded.
- Fix: Established strict rule — bump all 4 version locations after EVERY code change, immediately.
- Prevention: Version bump is part of every change, not a separate step. Never skip it.

## BUG-035
- Version found: `2.1.39`
- Severity: Medium
- Status: Fixed (v2.1.39)
- Root cause: `drawAccidental` returned immediately for all white keys (`if (!isBlackKey(midi)) return`). Non-diatonic white keys (e.g. F natural in G major) never got an accidental symbol on the grand staff.
- Fix: Rewrote `drawAccidental` to check `scaleSemitones` first. Diatonic notes skip. Non-diatonic black keys get ♯/♭. Non-diatonic white keys get ♮ (natural sign).
- Prevention: Accidental logic must consider all 12 semitones against the scale, not just black keys.

## BUG-036
- Version found: `2.1.44`
- Severity: Critical
- Status: Fixed (v2.1.46)
- Root cause: Two bugs preventing MIDI events from reaching spectators (and thus the livestream bridge): (1) Primary device had `roles.midi = false`, so `midi_event` messages from secondary handler were gated. (2) Primary handler's `midi_event` case was a no-op — it received events but never broadcast them.
- Fix: Set primary device `roles.midi = true`. Added `broadcastToRoom` (or `broadcastSpectators` fallback) in primary handler's `midi_event` case.
- Prevention: Any message type that needs to reach spectators must have an explicit broadcast call. Don't silently drop messages.

## BUG-037
- Version found: `2.1.50`
- Severity: Critical
- Status: Fixed (v2.1.52)
- Root cause: The `ws` npm library delivers ALL WebSocket messages as `Buffer` by default, regardless of whether they were sent as text or binary. The `wsMessages()` generator pushed raw `data` into the queue, and the consumer checked `typeof rawMsg === "string"` — which was ALWAYS false. All JSON text messages (`midi_event`, `midi_snapshot`, `text`, `set_mode`) were silently routed into the binary (PCM audio) branch and sent to Gemini as garbage audio. This is why zero `midi_event` messages ever reached the broadcast code despite the browser sending them correctly.
- Fix: Use the `isBinary` parameter from the ws `message` event. When `isBinary` is false, call `data.toString()` before pushing to the queue.
- Prevention: Never assume `typeof data === "string"` with the ws library. Always use the `isBinary` flag.

## BUG-038
- Version found: `3.2.0`
- Severity: High
- Status: Fixed (v3.2.1)
- Root cause: iPhone Pro Max in landscape has `window.innerWidth > 768` with touch, falsely triggering tablet mode detection. The tablet detection used `window.innerWidth >= 768 && 'ontouchstart' in window` which matches large phones in landscape.
- Fix: Changed detection to `Math.min(window.innerWidth, window.innerHeight) >= 768` — uses the smaller dimension so phones (narrow in portrait) never qualify.
- Prevention: Use min dimension for tablet vs phone detection. Phones are always narrow in one axis.

## BUG-039
- Version found: `3.2.3`
- Severity: High
- Status: Fixed (v3.2.4)
- Root cause: Phone secondary device auto-activated mic role on WebSocket connect, alongside camera. Jay only wants the phone as a camera — mic should stay on desktop.
- Fix: Removed `request_role mic` from secondary device onopen handler. Only camera auto-activates.
- Prevention: Never auto-activate mic on secondary devices. The primary desktop device owns the mic.

## BUG-040
- Version found: `3.2.0`
- Severity: Critical
- Status: Fixed (v3.2.8)
- Root cause: Camera fullscreen mode (`.camera-fullscreen` class) hid header, roles container, and status bar, then expanded video to fill the viewport. The bottom bar with Flip/Exit buttons was covered by the video element. No way to exit fullscreen — user was trapped in a full-screen camera view with no visible controls.
- Fix: (1) Removed auto-fullscreen on camera activation. (2) Made camera bottom bar `position: fixed; bottom: 0; z-index: 100`. (3) Added a manual fullscreen toggle button (`.cam-fs-btn`) at bottom-right of camera preview. Default state is non-fullscreen.
- Prevention: Never auto-fullscreen. Always provide a visible, accessible exit control. Fixed-position controls can't be hidden by sibling elements.

## BUG-041
- Version found: `3.2.0`
- Severity: Medium
- Status: Fixed (v3.2.8)
- Root cause: Phone secondary UI had `justify-content: center` and no `overflow-y`, so when content exceeded viewport height, elements were clipped with no way to scroll.
- Fix: Changed to `justify-content: flex-start` and added `overflow-y: auto; -webkit-overflow-scrolling: touch`.
- Prevention: Mobile UIs must always have scroll capability. Never use `justify-content: center` on containers that may overflow.

## BUG-042
- Version found: `3.2.0`
- Severity: Medium
- Status: Fixed (v3.2.9)
- Root cause: JPEG frames sent from phone to desktop only captured raw video — the MediaPipe hand skeleton overlay (drawn on a separate canvas) was not composited into the JPEG. Desktop finger tracking panel showed hands but no skeleton.
- Fix: Before JPEG encoding, composite the hand overlay canvas onto the offscreen canvas using `offCtx.drawImage(overlayCanvas, 0, 0, w, h)`.
- Prevention: When sending camera frames, always composite all visual layers (video + overlays) before encoding.

## BUG-043
- Version found: `3.2.0`
- Severity: Low
- Status: Fixed (v3.2.10)
- Root cause: Desktop finger tracking panel showed "Camera Off" even when phone camera was connected and streaming. The `cameraEnabled` flag wasn't being set from incoming `camera_state` messages, and there was no `mediapipeActive` state tracking.
- Fix: Added `mediapipeActive` state variable, set to true on `hand_state` message receipt. Camera badge now shows "MediaPipe: ON/OFF" based on this state.
- Prevention: Desktop state indicators must react to messages from connected secondary devices.

## BUG-044
- Version found: `3.2.0`
- Severity: Low
- Status: Fixed (v3.2.10)
- Root cause: MediaPipe HandLandmarker GPU delegate fails silently on some iPhones, leaving hand tracking non-functional with no error shown to user.
- Fix: Added GPU→CPU fallback chain. If GPU delegate creation fails, retry with `delegate: 'CPU'` using the saved fileset reference.
- Prevention: Always provide CPU fallback for WebGL/GPU-dependent features on mobile.
