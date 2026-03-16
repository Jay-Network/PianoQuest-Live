# Changelog

All notable changes to PianoQuest Live will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [3.2.38] - 2026-03-16

### Fixed
- **Force English only** — added languageCode: "en-US" to Gemini speechConfig and explicit "ALWAYS speak in English" to system instruction. Prevents Gemini from switching to other languages.

## [3.2.37] - 2026-03-16

### Fixed
- **Speech recognition echo suppression** — added 1.5s grace period after Gemini finishes speaking where speech recognition results are ignored. Prevents Gemini's speaker output from being transcribed as user input in the conversation panel.

## [3.2.36] - 2026-03-16

### Changed
- **Gemini only speaks when asked** — removed "may offer brief observations when player stops." Now Gemini stays completely silent unless the player directly addresses it. No unsolicited velocity analysis, no unprompted commentary after pauses.

## [3.2.35] - 2026-03-16

### Fixed
- **Partition drag broken by CSS zoom** — dragging the right resize handle caused panels to collapse because getBoundingClientRect returns zoomed coordinates but mouse events use viewport coordinates. Now divides all measurements by the current CSS zoom factor.

## [3.2.34] - 2026-03-16

### Fixed
- **Gemini stops repeating "I'm ready" during play** — MIDI snapshots sent with turnComplete=false so Gemini receives the data as context without being prompted to respond. Previously each 1.2s snapshot triggered a Gemini response. Fixed on all three MIDI paths (primary, secondary, bridge).

## [3.2.33] - 2026-03-16

### Fixed
- **Echo/feedback loop fix** — isBotSpeaking gate now only resets on turn_complete/interrupted signals, not on individual audio buffer onended. Previously mic would leak audio between chunks, causing Gemini to hear its own voice and create a feedback loop. Fixed on primary, secondary, and tablet audio paths.

## [3.2.32] - 2026-03-16

### Fixed
- **Gemini now answers questions** — rewrote system instruction with explicit Rule #1: ALWAYS respond when spoken to. Previously Gemini would say "I'm ready when you are" instead of answering general piano questions. Now conversation-first, analysis when MIDI data is available.

## [3.2.31] - 2026-03-16

### Changed
- **Silent during play rule** — Gemini now stays completely silent while MIDI notes are actively flowing. Only speaks when player talks, stops playing, or asks for feedback. No running commentary or interruptions.

## [3.2.30] - 2026-03-16

### Fixed
- **MIDI snapshots now sent to Gemini** — critical fix: primary WebSocket path was silently dropping midi_snapshot messages, so Gemini never received any MIDI data about piano playing

### Changed
- **System instruction: multimodal integration** — completely rewritten to emphasize integrating all three input streams (voice + MIDI + camera) simultaneously. Gemini now explicitly told to cross-reference what it sees, hears, and reads from MIDI data.

## [3.2.28] - 2026-03-16

### Added
- **Font size slider** in header — A to A slider (80%-200%), scales entire UI via CSS zoom, persisted in localStorage, defaults to 150%
- **Camera Refresh button** — appears when camera freezes, sends restart command to phone

## [3.2.27] - 2026-03-16

### Added
- **Camera Refresh button** — appears when camera freezes, sends restart command to phone

### Changed
- **Drill text 1.5x larger** — stage headers 15px, card names 20px, descriptions 15px, settings 16px, start button 18px
- **Drill result text halved** — medal 24px, grade 18px, metrics 15px

## [3.2.26] - 2026-03-16

### Changed
- **Natural conversational Gemini** — removed rigid command structure, Gemini now talks like a human piano teacher. Responds to any speech naturally, analyzes with numbers when it has MIDI data, doesn't ask for commands.

## [3.2.25] - 2026-03-16

### Changed
- **Active real-time analysis mode** — Gemini now actively monitors and comments during play (brief 1-sentence observations every 10-20s), responds to "hey Gemini", gives detailed analysis when asked

## [3.2.24] - 2026-03-16

### Changed
- **System instruction: explicit "hey Gemini" trigger** — Gemini now clearly responds when addressed by name, less aggressively silent

## [3.2.23] - 2026-03-16

### Changed
- **Drill result text 3x larger** — medal (48px), grade (36px), metrics (30px)

## [3.2.22] - 2026-03-16

### Added
- **7-stage drill curriculum** — 25 drills across 7 progressive stages: Single Finger (5), Two Fingers (3), Five-Finger Patterns (3), Scales & Arpeggios (5), Chords & Voicing (3), Advanced Technique (4), Musical Application (3)
- **Drill evaluation system** — accuracy, timing error, velocity error metrics with gold/silver/bronze/retry grading
- **Drill result coaching** — sends drill results to Gemini for quantitative analytical feedback
- **Note generator per drill type** — scales, arpeggios, chords, chromatic runs, rhythm patterns, expression phrases
- **Key selector** for scale/chord drills (C/G/D/F/Bb major, Am/Em/Dm minor)
- **Stage accordion UI** — collapsible stages, only Stage 1 expanded by default
- **Auto-stop + evaluation** — drills auto-finish after last target note, show medal + metrics
- **MIDI hit detection** — ±250ms window matches played notes to targets with timing/velocity tracking
- **On Demand passage analysis** — Record button captures MIDI events during a passage, computes IOI/velocity stats, sends full data to Gemini for deep quantitative analysis
- **Three analysis contexts** — Drill sessions, On-demand recording, Instant feedback (documented in system instruction)

### Changed
- **System instruction rewritten** — Gemini is now a quantitative analytical coach, not an encourager. All feedback must cite MIDI data (timestamps, velocities). No praise, no encouragement. Focus on tempo uniformity, dynamics habits, and identifying patterns the player doesn't notice.

### Fixed
- **Camera/MediaPipe freeze** — added server-side WebSocket keepalive pings (20s interval) for both primary and secondary connections, preventing Cloud Run idle timeout
- **Stale frame detection** on desktop — badge shows "Camera: FROZEN" if no frames for 5 seconds
- **Phone auto-reconnect** — secondary WebSocket auto-reconnects on disconnect (2s delay), unless room was intentionally closed

## [3.2.14] - 2026-03-16

### Changed
- **Phone camera frame rate 4fps → 20fps** (250ms → 50ms) for smooth hand tracking on desktop

## [3.2.13] - 2026-03-16

### Changed
- **MediaPipe moved from phone to desktop** — phone sends raw JPEG frames, desktop runs HandLandmarker locally with GPU (CPU fallback). Skeleton overlay drawn on desktop camera panel. Hand state sent to server for Gemini.
- **Phone stripped of all MediaPipe code** — lighter, faster, just camera + JPEG capture

### Fixed
- **Removed all content above phone camera** — no header, no status text, no "Camera active" label
- **Bottom bar (Flip/Exit) always visible** on phone, not just in fullscreen

## [3.2.12] - 2026-03-16

### Fixed
- **Removed header/status text above phone camera** — phone shows only camera view, nothing above it
- **Removed "Camera active" text** from bottom bar
- **Phone camera fills viewport** — no padding, margins, or borders on secondary device
- **Bottom bar (Flip/Exit) always visible** — not just in fullscreen mode
- **MediaPipe hand_state sent immediately** on init — desktop sees "MediaPipe: ON" as soon as tracker loads

## [3.2.11] - 2026-03-16

### Changed
- Simplified camera badge to "MediaPipe: ON/OFF" — removed hand count display

## [3.2.10] - 2026-03-16

### Added
- **Fullscreen toggle button** on camera preview (bottom-right corner). Starts normal, tap to go fullscreen, tap again to exit.
- **CPU fallback for MediaPipe** — if GPU hand tracking fails (common on iPhones), automatically retries with CPU delegate.
- **MediaPipe status indicator on desktop** — finger tracking panel badge shows "MediaPipe: ON/OFF" with hand count.

### Fixed
- **"Camera off" bug** — finger tracking panel now correctly shows camera/MediaPipe status when phone is connected.

## [3.2.9] - 2026-03-16

### Fixed
- **Phone secondary UI scrollable** — added overflow-y:auto so content below the camera can be scrolled to. Aligned to top instead of center.

## [3.2.8] - 2026-03-16

### Fixed
- **Removed camera fullscreen mode on phone** — camera stays as inline preview, header/status/controls remain visible. No more fullscreen takeover hiding everything.

## [3.2.7] - 2026-03-16

### Fixed
- **Hand skeleton overlay composited into JPEG frames** — desktop camera panel now shows MediaPipe bone overlay. Phone overlay canvas drawn onto offscreen canvas before encoding, so both phone and desktop see hand bones.

## [3.2.6] - 2026-03-16

### Fixed
- **Camera bottom bar always visible on iPhone** — changed to position:fixed overlay at bottom with z-index:100 and safe-area-inset padding. Camera video no longer covers the Flip/Exit buttons.

## [3.2.5] - 2026-03-16

### Changed
- **Left panel (Gemini dialog) doubled to 520px** default width on desktop (was 260px).

## [3.2.4] - 2026-03-16

### Fixed
- **Phone only auto-activates camera** — removed mic auto-activation from phone. Mic is handled by iPad/tablet or desktop, not the camera phone.

## [3.2.3] - 2026-03-16

### Changed
- **Phone auto-activates camera + mic on QR scan** — skips role selection cards, jumps straight to live camera with hand tracking. No buttons to tap.

## [3.2.2] - 2026-03-16

### Changed
- **Auto-select CASIO MIDI device** — CASIO USB-MIDI is now preferred by default. Selection saved to localStorage so it persists across deploys.

## [3.2.1] - 2026-03-16

### Changed
- **QR code shown by default** when room is created — removed Copy Link and QR toggle buttons. QR is always visible for instant scanning.

## [3.2.0] - 2026-03-16

### Added
- **iPad/Tablet primary device mode** — new `?room=CODE&mode=tablet` or auto-detected (screen >= 768px + touch). Full panel UI with Piano, Chat, Audio, Fingers, Drills, Grand Staff. Toggle panels on/off via pill toolbar. Draggable partition handles (touch + mouse) for resizing. Auto-mic activation with echo cancellation. Landscape two-column / portrait single-column responsive layout. Panel visibility and sizes persisted in localStorage.

## [3.1.11] - 2026-03-16

### Fixed
- **Camera bottom bar reverted to simple flex layout** — back to the working v3.1.2 approach: solid bar as flex child of app, not absolute/fixed. Status text left, Flip and Exit buttons right.

## [3.1.10] - 2026-03-16

### Fixed
- **Camera controls actually visible on iPhone** — moved bottom bar to document.body with position:fixed, z-index:100. Added safe-area-inset for iPhone notch. Controls now float above everything.

## [3.1.9] - 2026-03-16

### Fixed
- **Camera controls visible** — fixed overflow:hidden on camera wrap clipping the floating buttons. Controls now render over camera feed.

## [3.1.8] - 2026-03-16

### Improved
- **Camera fullscreen UI redesign** — floating controls overlay on camera feed. Circular flip (🔄) and exit (✕) buttons with backdrop blur, status text bottom-left. No top bar. Clean professional look.

## [3.1.7] - 2026-03-16

### Fixed
- **Camera flip button larger** — increased size/padding so it's tappable on phone in fullscreen mode

## [3.1.6] - 2026-03-16

### Improved
- **MediaPipe status feedback** — camera bottom bar shows "Loading hand tracker...", "Hand tracking active", or error message so you can see if MediaPipe loaded
- **Side-view finger height analysis** — compares fingertip Y to knuckle Y to measure finger lift. Sends fingerHeights data in hand_state messages
- **Gemini vision instruction** — updated to mention side-view camera, finger lift height, curved vs flat fingers, wrist position

## [3.1.5] - 2026-03-16

### Added
- **Camera flip button** — 🔄 button in camera bottom bar switches between front and back camera on phone. Defaults to rear camera, tap to toggle.

## [3.1.4] - 2026-03-16

### Fixed
- **FINGER TRACKING panel always visible** — panel no longer starts hidden. Shows "Camera off" placeholder by default, camera feed appears when phone connects.

## [3.1.3] - 2026-03-16

### Added
- **Camera preview on desktop** — primary device shows live camera feed from phone in the FINGER TRACKING panel. Frames stream at 4fps for smooth preview.
- **Increased camera frame rate** — phone sends frames at 4fps (was 1fps). Server throttles Gemini to 1fps but forwards all frames to desktop for smooth preview.

## [3.1.2] - 2026-03-16

### Changed
- **Camera fullscreen mode on secondary device** — when camera role activates, role cards and header hide, camera fills the screen in landscape orientation. Bottom bar shows "PianoQuest Room CODE" + status + Exit button. Tapping Exit deactivates camera and returns to role selection.

## [3.1.1] - 2026-03-16

### Fixed
- **Secondary device role cards now tappable** — phone users can tap MIC/CAMERA/MIDI cards to self-assign roles instead of needing primary device to assign. Server handles `request_role` messages from secondary devices.

## [3.1.0] - 2026-03-16

### Added
- **Camera finger tracking** — hybrid MediaPipe + Gemini Vision approach:
  - Phone camera sends JPEG frames (1fps) to Gemini for vision-based technique coaching
  - MediaPipe HandLandmarker runs client-side on phone for real-time hand skeleton overlay
  - Camera role in device management (secondary device can be assigned camera)
  - `report_technique` tool — Gemini correlates what it sees (hands) with what it hears (piano) for multimodal coaching
  - FINGER TRACKING panel on primary device shows technique report cards (EYE/EAR observations)
  - Camera status badge: "Camera Off" / "1 Hand" / "2 Hands Ready"
  - Drill camera integration — Gemini told when camera is active during drills
- **Vision section in system instruction** — Gemini knows to connect visual + audio observations

## [3.0.4] - 2026-03-16

### Fixed
- **Spectator endpoint hardened** — sends `spectator_status` on connect (bridge knows it's live), pong-based dead connection detection, 20s keepalive pings. Bridge reconnections immediately start receiving MIDI.

## [3.0.3] - 2026-03-16

### Fixed
- **Stop sending midi_snapshot to Gemini** — text summaries triggered "MIDI update received, staying silent" responses. Gemini hears piano audio directly; text MIDI data is redundant.

## [3.0.2] - 2026-03-16

### Added
- **Drills tab** on right panel (before Scores tab) with Stage 1 exercises:
  - 1-1 Tempo: play a single note at steady BPM, target notes flow in waterfall/grand staff
  - 1-2 Strength: play a note at specific dynamic level, Gemini evaluates velocity
- Drill settings: note selector, BPM, measures, target dynamic (for 1-2)
- Tab switching between Drills and Scores

### Fixed
- **Mic echo prevention** — isBotSpeaking gate mutes mic audio and suppresses SpeechRecognition while Gemini is speaking (pattern from JDialogs Pilot)

## [3.0.1] - 2026-03-16

### Fixed
- **Gemini talking nonstop** — midi_snapshot was sent with `turnComplete: true`, triggering a Gemini response every 250ms. Changed to `turnComplete: false` so MIDI data is context-only. Gemini only responds when user speaks.

## [3.0.0] - 2026-03-16

### Fixed
- **CRITICAL: wsMessages Buffer/string fix** — ws library delivered all messages as Buffer; text JSON (midi_event, midi_snapshot, text) was silently treated as PCM audio. Fixed with isBinary flag.
- **Removed debug logging** from v2.1.50-v2.1.51

### Changed
- **Gemini stays silent until spoken to** — rewrote system instruction so Gemini only responds when user addresses it by voice. No unsolicited coaching. No greeting on connect.
- **Removed auto-greeting** — server no longer sends "Hi!" to Gemini on session start

## [2.1.52] - 2026-03-16

### Fixed
- **CRITICAL: wsMessages delivered text as Buffer** — ws library delivers ALL messages as Buffer by default. `typeof rawMsg === "string"` was always false, so JSON messages (midi_event, midi_snapshot, text, set_mode) were silently treated as PCM audio. Fixed by using ws `isBinary` parameter to convert text messages to string.

## [2.1.51] - 2026-03-16

### Fixed
- **Debug: log ALL text message types** from primary WS handler to diagnose why midi_event never appears in server logs

## [2.1.50] - 2026-03-16

### Fixed
- **MIDI broadcast debug logging** — added recv logging for midi_event and midi_snapshot at primary WS handler to diagnose why spectators receive zero MIDI frames

## [2.1.49] - 2026-03-16

### Fixed
- **Spectator WebSocket keepalive** — added 25s ping interval to prevent Cloud Run from killing idle spectator connections. Bridge was connecting/disconnecting repeatedly due to timeout.
- **MIDI event logging** — added console.log for midi_event broadcasts to diagnose pipeline issues.

## [2.1.48] - 2026-03-16

### Changed
- **Speaking indicator moved** from header to Audio Level panel. Now shows two rows: "User" (mic level bar) and "Gemini" (speaking/silent with volume bar). Removed clutter from header.

## [2.1.47] - 2026-03-16

### Changed
- **Center panel header bar** with controls: `Scale: [dropdown] Tempo: [slider] bpm Time signature: [dropdown]`. Horizontal layout, labeled, above the midi-stack.
- Removed overlay controls from grand staff panel — controls no longer overlap the notation.

## [2.1.46] - 2026-03-16

### Fixed
- **CRITICAL: MIDI events now broadcast to spectators** — Primary device had `midi: false` role and primary handler silently dropped `midi_event` messages. Fixed both: primary now has `midi: true` and broadcasts events to room + spectators. This fixes the livestream pipeline (PianoQuest Live → bridge → jayismocking.com/live).

## [2.1.45] - 2026-03-16

### Changed
- **Staff control dropdowns 3x wider** (36px→54px) and taller (font 9px→12px, more padding).
- **BPM slider** fixed height (80px) instead of stretching to bottom of panel. Starts just below dropdowns.

## [2.1.44] - 2026-03-16

### Changed
- **Sheet Music button** added to score-actions in score panel (left of "Load as Target Notes"). Toggles between sheet music image view and score browser within the right panel — no more popup modal.
- Removed redundant `loadTargetBtn` and footer buttons from score panel.

## [2.1.43] - 2026-03-16

### Changed
- **Grand staff notes twice as wide** — `measuresVisible` reduced from 4 to 2, doubling horizontal note/clause width.
- **Removed midi-footer** — time signature and scale dropdowns + vertical BPM slider moved into grand staff panel overlay at left edge.

## [2.1.42] - 2026-03-16

### Fixed
- **Sheet Music & Load buttons moved** to bottom-left of score panel (right column), not the midi-footer.

## [2.1.41] - 2026-03-16

### Added
- **Sheet Music button** in midi-footer (left side) — opens modal overlay showing Fur Elise reference PNG with link to full PDF.
- **Load as Target Notes button** — fetches `fur-elise.json`, sets tempo/key/time sig, and spawns all notes as target notes flowing on the grand staff.
- Sheet music assets served from `/static/sheets/`.

## [2.1.40] - 2026-03-16

### Added
- **Missing scales**: F# major (6#), Db major (5b), Gb major (6b), and corresponding minor scales (D#m, G#m, Bbm, Ebm) in dropdown and KEY_SIG_MAP.

## [2.1.39] - 2026-03-16

### Fixed
- **Grand staff accidentals for non-diatonic white keys** — white keys outside the selected scale now show a natural sign (♮). Previously `drawAccidental` only handled black keys, so non-diatonic white keys (e.g. F natural in G major) had no accidental indicator.

## [2.1.38] - 2026-03-16

### Changed
- **Dynamic bars panel taller** — keyboard panel proportion increased (2.5→3.5), internal split 50/50 (was 40/60), so dynamic bars are same height as keys.
- **Waterfall shrunk** proportionally (5→4) to accommodate taller keyboard+dynamics panel.
- **Dynamics labels larger** — pp, p, mp, etc. text increased from 12px to 18px bold.

## [2.1.37] - 2026-03-16

### Changed
- **Treble clef nudged down** (0.85 line spacing offset, was 1.0) and **left** (X -4, was -2).
- **Non-scale black keys more grey** (#444 instead of #333) for clearer distinction from in-scale keys.

## [2.1.36] - 2026-03-16

### Fixed
- **Black key scale indication inverted**: In-scale black keys now normal black (#111), non-scale grayed out (#333). Removed blue border glow that made in-scale keys look washed out. Only small blue dot remains as indicator.

## [2.1.35] - 2026-03-16

### Changed
- **Treble clef moved left** (X 2→-2) and **lowered** (offset 1.5→1.0 line spacings).

## [2.1.34] - 2026-03-16

### Fixed
- **Black key scale indication**: In-scale black keys now #181818 (normal), non-diatonic #060606 (much darker). No more gray-washed look.
- **Staff lines extended to left edge in redraw section** — second draw was still using `clefW` as start, now uses 0.

## [2.1.33] - 2026-03-16

### Fixed
- **Clef redraw used hardcoded old positions** — the second draw (after note history) was overwriting the first with wrong coordinates `(4, trebleG4Y)` and `(6, bassClefY)`. Now uses same computed positions as initial draw.

## [2.1.32] - 2026-03-16

### Changed
- **Scale keyboard indicators improved**: Diatonic keys now have a blue bottom strip + dot indicator. Non-diatonic white keys darkened more (#b8b8b8 vs #f4f4f4). Diatonic black keys brighter (#2a2a2a vs #0c0c0c) with blue bottom strip, dot, and subtle blue border glow.
- **Time signature shifted left** (tsX+16→tsX+10) to match treble clef repositioning.

## [2.1.31] - 2026-03-16

### Changed
- **Treble clef moved up** (1.0→1.5 line spacings above G4) and slightly left (X 4→2).
- **Staff lines extend to left edge** of grand staff panel (from X=0 instead of clefW), matching dynamic bar guide lines.

## [2.1.30] - 2026-03-16

### Fixed
- **CRITICAL: Page hang on render** — `drawKeyboard()` referenced non-existent `staffKeySig` element (correct ID: `staffScale`). Null reference killed the entire animation loop. Gemini audio still worked because it runs on a separate WebSocket/AudioWorklet thread.

## [2.1.29] - 2026-03-16

### Fixed
- **Treble clef moved higher** (offset 0.5→1.0 line spacing up from G4).
- **Bass clef lowered slightly** (offset 1.0→1.5 line spacing from F3).
- **Bass clef right-aligned with treble** — dots of both clefs now vertically align (bass X computed from treble clef right edge).

## [2.1.28] - 2026-03-16

### Added
- **Scale-aware keyboard highlighting**: Diatonic keys for the selected scale appear brighter (white keys #f4f4f4 vs #c8c8c8, black keys #222 vs #111) with a subtle blue top-edge indicator. Does not interfere with dynamic coloring when keys are active.

## [2.1.27] - 2026-03-16

### Fixed
- **Bass clef moved up** — dot now aligns with 2nd line from top (F3 line) instead of 3rd line. Offset reduced from 2.5→1.0 line spacings.
- **Treble clef moved up** by half a line spacing for better vertical positioning.

## [2.1.26] - 2026-03-16

### Changed
- **Key signature accidentals 3x larger** (11px→33px bold white), positioned to the right of time signature numbers with proper spacing (22px per accidental).

## [2.1.25] - 2026-03-16

### Fixed
- **Treble clef moved further up** (-3→-6px offset from G4 line).
- **Bass clef moved down and right** (1.0→2.5 line spacing offset, 10→14px X position).

## [2.1.24] - 2026-03-16

### Changed
- **Time signature numbers 20% larger** on grand staff (0.48→0.576 scale factor).

## [2.1.23] - 2026-03-16

### Changed
- **Accidentals positioned left of start bar** on grand staff (offset -14px from noteX).

## [2.1.22] - 2026-03-16

### Changed
- **Treble clef shifted up 3px** for better vertical centering on staff.
- **Bass clef 20% larger** (1.008→1.21 scale), moved up (1.5→1.0 line spacing offset), shifted right (6→10px).
- **Time signature shifted further right** (tsX+10→tsX+16) for more clef breathing room.

## [2.1.21] - 2026-03-16

### Changed
- **Grand staff finger-held matches waterfall**: Finger-held segments now use same filled gradient as waterfall (0.9 alpha bright edges, 0.7 darker center, 1px edge highlights). No longer looks hollow or dim.
- **Treble clef 20% larger**: Scale factor 1.2→1.44 (cumulative).
- **Bass clef moved higher**: Shifted up half a note spacing.
- **Time signature shifted right**: 4px rightward for better spacing from clefs.
- **Accidentals restyled**: Bold white 22px, centered on the note bar (was 11px colored, offset left).

## [2.1.20] - 2026-03-16

### Fixed
- **Pedal sustain too dim everywhere**: Interior fill increased from 0.12→0.4 alpha across waterfall, grand staff, and dynamic bars. Rim thickness increased from 1.5→2.5px. Rim alpha raised from 0.5→0.7. No longer hollow — pedal segments now have visible dimmed fill with bright glowing rim on top.

## [2.1.19] - 2026-03-16

### Changed
- **Grand staff breathing sync**: Finger-held segments now pulse in sync with pedal-sustained segments (same sine wave `0.8 + 0.2 * sin(t/400 + midi*0.5)`). Both segments breathe together.
- **Grand staff note heads → thin bars**: Note heads replaced with thin vertical rectangles (3px wide) for clear timing indication instead of round circles.
- **Grand staff start bars widened**: Start bars now 3px (was 2px) matching the note head width.

## [2.1.18] - 2026-03-16

### Changed
- **Dynamic bars visual upgrade**: Finger-held bars now have inner gradient (bright edges, darker center) with glow and bright top cap. Pedal-sustained bars render as glassy hollow with animated glowing rim (matching waterfall/grand staff).
- **Pedal glow brightness increased**: Raised pulse floor from 0.6→0.8 (subtler animation), interior fill from 0.12→0.2 alpha, rim from 0.5→0.6 alpha. Prevents pedal bars from going too dim during animation trough.

## [2.1.17] - 2026-03-16

### Changed
- **Waterfall note bars**: Finger-held segments now have inner gradient (bright edges, darker center) instead of flat fill. Pedal-sustained segments render as glassy hollow bars with animated glowing rim (matching grand staff).
- **Grand staff square edges**: All note bars use square edges instead of rounded corners for clear timing indication. Thin start bars (2px) mark note onset.
- **Grand staff inner gradient**: Finger-held segments use vertical gradient (bright edges, darker center) for premium look.

## [2.1.16] - 2026-03-16

### Fixed
- **Target notes fall from top in waterfall**: Target notes now correctly fall from top of screen toward keyboard edge (were previously appearing from wrong direction)

### Added
- **Target note dynamics on keyboard**: Ghost/dashed dynamic bars show expected velocity for approaching target notes, with pulsing outline that fades in as note approaches
- **Velocity data in target notes**: Score dynamics markings (pp, mf, etc.) now propagate to target note velocity
- **Visual effects** (from jworks:81): Note-hit flash/halo at keyboard edge, particle burst on note attack (6-16 velocity-scaled particles), gradient tail on falling notes

## [2.1.15] - 2026-03-16

### Changed
- **Glassy pedal sustain bars**: Pedal-sustained segments now render as hollow transparent bars with animated glowing rim (pulsing at ~2.5Hz). Finger-held segments remain solid filled.
- **Refined dynamics color palette**: Each color professionally optimized by design team — cobalt blue (pp), cyan (p), emerald (mp), warm gold (mf), amber-orange (f), pure red (f+), electric magenta (ff), white (fff). Fixes pistachio green mp and pink-cast red.

## [2.1.14] - 2026-03-16

### Fixed
- **Grand staff pedal brightness too dim**: Removed double/triple alpha dimming on pedal-sustained segments. Active notes pedal segment now uses `globalAlpha=0.55` (was 0.35). History pedal segment uses `darkenedColor` without extra alpha multiplication.
- **Grand staff finger-held tail dims on release**: History finger-held segments now use full color with constant `globalAlpha=0.6` — same as active notes. No distance-based fade on tails, matching waterfall behavior.

### Changed
- **Treble clef 1.2x larger**: Scale factor increased from `staffH * 0.924` to `staffH * 0.924 * 1.2`
- **Bass clef moved down one note**: Shifted down by additional `bassLineSpacing`

## [2.1.13] - 2026-03-16

### Fixed
- **Fur Elise sheet music rewrite**: Complete rewrite from 8 to 27 measures matching reference score. Corrected time signature (3/4), bass broken-chord patterns (A2-E3, E2-B2), added B section (C major, mf), A' return, 1st/2nd endings, dynamics markings, and final cadence.

### Added
- Fur Elise reference files saved to `docs/reference/` (PNG + PDF from pitt.edu)

## [2.1.12] - 2026-03-16

### Fixed
- **Grand staff clef/time sig overlap (final fix)**: Use `ctx.measureText()` to dynamically compute actual clef glyph widths instead of hardcoded clefW. Time signature and key signature now positioned based on measured pixel widths, guaranteed no overlap regardless of font rendering.

## [2.1.11] - 2026-03-16

### Fixed
- **Grand staff pedal split position inverted**: `fingerEndX` was calculated as `playLineX - fingerMs * pxPerMs` (wrong) instead of `playLineX - (holdMs - fingerMs) * pxPerMs` (correct). The finger/pedal bright/dim split was at the wrong X position — finger segment appeared tiny, pedal segment appeared huge.

## [2.1.10] - 2026-03-16

### Changed
- **Edge-to-edge layout**: Side panels flush to browser window edges, center panel gets maximum width. Removed app horizontal padding (0px sides). Header retains 12px padding.

## [2.1.9] - 2026-03-16

### Fixed
- **App not using full browser width**: Removed `max-width: 1920px` and `margin: 0 auto` — app now fills entire browser window

## [2.1.8] - 2026-03-16

### Fixed
- **Grand staff clef/time sig overlap**: Widened clef zone from 32→44px and time sig zone 18→22px. Clef glyphs at large font sizes need more horizontal room.

## [2.1.7] - 2026-03-16

### Fixed
- **Dynamics colors**: Restored distinct per-level colors (pp=steel blue, p=teal, mp=seafoam, mf=gold, f=orange, ff=hot pink, fff=white). Previous commit wrongly replaced entire rainbow with monotone blue gradient — Jay only wanted the ugly pistachio green fixed, not the multi-color scheme removed.

## [2.1.6] - 2026-03-16

### Fixed
- **Grand staff pedal sustain brightness**: Active notes with finger released but pedal sustaining now show dim pedal segment (was all bright until pedal release). Splits active tail into finger-held (bright) + pedal-sustained (dim) matching waterfall behavior.

## [2.1.5] - 2026-03-16

### Fixed
- **Dynamics colors too washed out**: Increased blue saturation so gradient is clearly visible (deep blue→rich blue→sky blue→white instead of gray-blue→white)

## [2.1.4] - 2026-03-16

### Fixed
- **Color palette**: Replace rainbow dynamics with cool blue→white temperature ramp (Option B by jworks:81) — quiet=steel blue, loud=white

## [2.1.3] - 2026-03-16

### Fixed
- **Clef area widened**: 24→32px so clefs don't overlap time signature, time sig zone 16→18px

## [2.1.2] - 2026-03-16

### Fixed
- **Panel resize handles**: Restructured from clipped absolute-positioned to grid-level draggable columns (left ↔ center ↔ score)

## [2.1.1] - 2026-03-16

### Fixed
- **Gemini speech/piano confusion**: System instruction clarifies two audio signal types (voice vs piano), requires MIDI data before coaching
- **Grand staff tail brightness**: Match waterfall rules — finger-held segment stays bright, pedal-sustained dims
- **Treble clef**: 10% larger (0.84→0.924), moved right
- **Bass clef**: Moved one note lower so dots straddle F3 line

## [2.1.0] - 2026-03-16

### Added
- **Web Speech API transcription**: Browser-side SpeechRecognition for user input transcript (replaces broken Gemini `inputAudioTranscription` which outputs wrong languages)
- SpeechRecognition on primary device (auto-starts on connect)
- SpeechRecognition on secondary mic device (starts/stops with mic role)
- `user_speech_transcript` WebSocket message type relayed to all room devices as `input_transcript`
- Safari compatibility via `webkitSpeechRecognition` fallback
- Auto-restart on unexpected stop (both Chrome and Safari)

### Fixed
- **Output transcription accumulation**: Gemini output transcript now appends chunks instead of replacing buffer (was showing only last few words)
- **Grand staff treble clef**: Shrunk 20% (staffH * 1.05 → 0.84)
- **Grand staff bass clef**: Enlarged 40% (staffH * 0.72 → 1.008), repositioned to lower-right
- **Grand staff time signature**: Shifted right to give clefs room

### Removed
- `inputAudioTranscription` from Gemini config (known API bug — outputs Arabic, Korean instead of English)

## [2.0.3] - 2026-03-16

### Fixed
- **Transcription**: Added `inputAudioTranscription` and `outputAudioTranscription` to Gemini config (was missing — transcripts never generated)
- **Speech detection**: Added `realtimeInputConfig.automaticActivityDetection` so Gemini detects end of speech
- **Grand staff notes dark on release**: Removed pedal-only alpha distinction, matched history tail alpha to active tail alpha (0.6)
- **Panel layout**: Added `height:100%` to MIDI stack canvases so they fill their containers

## [2.0.2] - 2026-03-16

### Fixed
- **CRITICAL**: Reverted from broken ADK `agent.runLive()` back to SDK `client.live.connect()` — ADK TS v0.5.0 `runLive()` throws "Live mode is not implemented yet"
- Fixed all remaining `liveQueue` references in secondary device handler, MIDI flush, and camera handler to use SDK `sendRealtimeInput()`/`sendClientContent()`
- Added greeting message ("Hi! I just sat down at the piano") sent 1s after Gemini connects so Gemini speaks first
- Added debug logging: setupComplete, audio chunk count, transcription, turnComplete events
- Removed audio gating — audio sent to Gemini immediately without waiting for speech detection

## [2.0.1] - 2026-03-16

### Fixed
- **CRITICAL**: Grand staff missing — canvas had `height:100%` CSS but flex parent had zero height. Replaced with `sizeMidiStack()` that computes concrete pixel heights from midi-stack container (5:2.5:4 ratio for waterfall:keyboard:staff)

## [2.0.0] - 2026-03-16

### Changed
- **BREAKING**: Replaced @google/genai SDK `live.connect()` with ADK `agent.runLive()` + `LiveRequestQueue` (same proven pattern as JDialogs Copilot jworks:94)
- Audio/video/text now sent via `liveQueue.sendRealtime()` and `liveQueue.sendContent()` instead of `session.sendRealtimeInput()`
- Tool calls handled automatically by ADK (no manual `sendToolResponse`)
- Transcription events from ADK event stream (`event.inputTranscription`, `event.outputTranscription`, `event.turnComplete`)
- Removed `processGeminiMessage()` and `TranscriptState` (replaced by ADK event loop)

### Fixed
- Grand staff viewport: all canvases auto-size to fill browser window (flex 5:2.5:4)
- Grand staff vertical range: A0 at bottom, C8 at top — no wasted space
- Active note tails stay bright on finger release (was darkened for pedal-sustained)
- Removed stems from grand staff notes
- App fits in viewport: no scrolling

## [1.9.1] - 2026-03-16

### Fixed
- **CRITICAL**: Gemini not responding — added systemInstruction + speechConfig (voice: Puck) to live.connect config. Without system instruction Gemini had no reason to respond.
- Grand staff viewport: all 3 canvases (waterfall, keyboard, grand staff) now auto-size to fill browser window height using flex proportions (5:2.5:4)
- Grand staff vertical range: A0 at canvas bottom, C8 at canvas top — no wasted space
- Grand staff active note tails stay bright on finger release (was using darkenedColor for pedal-sustained)
- Removed stems from grand staff notes (no vertical sticks)
- App fits in viewport: html/body overflow hidden, no scrolling

### Changed
- Canvas heights derived from container rect.height instead of hardcoded values (560/520/344px)

## [1.9.0] - 2026-03-15

### Fixed
- Grand staff BPM: measure width no longer changes with tempo. Fixed to always show 4 measures in scrollable area. Higher BPM = faster scroll speed, not narrower measures.
- Derived `pxPerMs = measureWidthPx / measureDurationMs` instead of fixed `scrollWindow / scrollableW`

## [1.8.9] - 2026-03-15

### Fixed
- Treble clef too large: reduced from staffH*1.6 to staffH*1.05 (~35% smaller)
- Bass clef too high: removed upward offset (staffH*0.08), now centered directly on F3 line
- Bass clef size reduced from staffH*0.95 to staffH*0.72 for proper proportions

## [1.8.8] - 2026-03-15

### Fixed
- **CRITICAL**: Gemini audio responses were gated behind `turnHasUserSpeech` flag — audio buffered in `pendingAudioChunks` and never sent to client. Removed gate; audio now sent immediately.
- Transcript sending no longer gated on `turnHasUserSpeech` — always send on turnComplete/interrupted

### Added
- Diagnostic logging for Gemini message keys (non-audio messages logged for debugging)

## [1.8.7] - 2026-03-15

### Added
- Conversation panel with real-time speech transcription (user + Gemini messages)
- Chat CSS adopted from JDialogs Copilot (message bubbles, scroll, animations)
- `addMessage()` function for rendering chat messages with labels and timestamps
- `inputAudioTranscription` and `outputAudioTranscription` enabled in Gemini config

### Changed
- WebSocket handler now processes `input_transcript` and `output_transcript` messages

## [1.8.6] - 2026-03-15

### Changed
- Unified BPM: single slider controls both waterfall and grand staff tempo
- BPM slider, time signature, and scale selector moved to footer bar below midi stack
- Removed staff-controls sidebar from grand staff (was left sidebar with tiny inputs)
- BPM slider range extended to 40-300

### Removed
- BPM slider from header
- Tempo input from grand staff sidebar

## [1.8.5] - 2026-03-15

### Added
- Gemini speaking indicator with volume bar in header (shows Speaking/Silent + green volume fill)

### Fixed
- Grand staff clef placement: treble clef uses textBaseline='middle' at G4, bass clef at F3 with staffH-proportional font sizes
- Time signature: numbers centered between lines 3-5 (top) and 1-3 (bottom) using middle line as split

### Removed
- COACHING FOCUS panel from left sidebar

## [1.8.4] - 2026-03-15

### Fixed
- **CRITICAL**: Empty GOOGLE_API_KEY on Cloud Run — cloudbuild.yaml had `_API_KEY: ''`, now uses Secret Manager `google-api-key:latest`
- Grand staff clef placement: treble clef centered on G4 line, bass clef on F3 line (proper music notation)
- Grand staff time signature: top/bottom numbers centered in upper/lower halves of each staff
- Clef and time signature font sizes scale with lineSpacing

## [1.8.3] - 2026-03-15

### Fixed
- Waterfall: pedal-sustained notes no longer revert to bright on pedal release (close open history on re-trigger)
- Grand staff: note heads scroll left from play line at tempo speed (were stuck on play line)
- Grand staff: active notes always bright while sounding (were turning dark on finger release)
- Grand staff: pedal-sustained tail drawn dimmer, head stays bright

## [1.8.2] - 2026-03-15

### Fixed
- **CRITICAL**: Strip Gemini config to absolute minimum (responseModalities only) — no tools, no system instruction, no speech config, no transcription, no realtime input config
- Grand staff positioning: highest piano key (C8/MIDI 108) now at y=0, touching keyboard panel bottom

## [1.8.1] - 2026-03-15

### Fixed
- **CRITICAL**: Replace raw WebSocket to Gemini with @google/genai SDK `live.connect()` — raw WS was closing instantly; SDK works (confirmed by JayWalks, BookSage)
- Grand staff gap: position top treble line at ~15px from canvas top to eliminate gap below keyboard

### Changed
- Gemini Live connection now uses SDK callbacks (onopen, onmessage, onerror, onclose) instead of manual WebSocket protocol

## [1.8.0] - 2026-03-15

### Fixed
- **CRITICAL**: Gemini model name `gemini-2.5-flash-native-audio-latest` → `gemini-2.5-flash-native-audio-preview-12-2025` (latest alias doesn't exist)
- **CRITICAL**: Setup JSON snake_case → camelCase (generationConfig, responseModalities, etc.)
- **CRITICAL**: Duplicate JS variable declarations (sessionActive, currentScore) killed all JavaScript
- Grand staff gap: shifted center up (0.5→0.42) to minimize gap below keyboard
- Grand staff: past notes of same pitch no longer disappear when key pressed
- Fur Elise: proper treble/bass clef separation, correct 3/8 timing, accidentals

### Added
- B&W monotone color scheme matching jayismocking.com (designed by jworks:81 + jworks:97)
- Score panel draggable resize handle
- Score renderer: clef symbols, accidental marks (♯/♭), hollow noteheads for long notes
- Start/Stop merged into single toggle button
- MIDI dropdown auto-refreshes on focus

### Changed
- All panels 2x larger on desktop (waterfall 560px, grand staff 520px, dynamics 144px, keyboard 200px)
- Score panel widened to 560px
- App max-width 1920px
- Panel headers removed (Piano Roll, Keyboard, Grand Staff labels stripped)
- Grand staff controls moved to left sidebar
- Dynamic bars moved from piano roll to keyboard canvas

### Removed
- All amber/yellow colors — replaced with white accent
- Separate Stop button (merged into Start toggle)
- Panel header labels from midi stack

## [1.7.0] - 2026-03-15

### Added
- Score panel (right column): browse sheet music files, preview on mini grand staff
- Sheet music file system: `/sheets/` directory served statically, `/api/sheets` tree listing
- `sheets/classical/fur-elise.json` — Fur Elise opening measures as digital note data
- "Load as Target Notes" — sends score notes to waterfall + grand staff target system
- Color mode toggle: velocity-based coloring on sheet music notation
- Score canvas: mini grand staff renderer with treble/bass, stems, ledger lines

### Changed
- Layout: 3-column grid (left sidebar, center midi stack, right score panel)
- Keyboard panel moved above grand staff (dynamic bars grow upward from keyboard top)
- Dynamic bars removed from piano roll canvas, integrated into keyboard canvas
- Piano roll waterfall uses full canvas height

## [1.6.2] - 2026-03-15

### Fixed
- **CRITICAL**: Move `input_audio_transcription` and `output_audio_transcription` from `generation_config` to `setup` level in Gemini BidiGenerateContent setup message (caused instant close with code 1007)
- Grand staff play line moved to center (was at 12% from left)
- Active notes now elongate leftward while held, at tempo-matched speed (pxPerMs)
- Note history scrolls left at tempo-matched speed (same as measure bar flow)
- History notes show duration tails (rounded rectangles) proportional to hold time

## [1.6.1] - 2026-03-15

### Fixed
- **CRITICAL**: Replace @google/genai SDK `live.connect()` with raw WebSocket to Gemini BidiGenerateContent endpoint. SDK has a bug causing instant session close after setup. Raw WS works perfectly.
- Partition bar visibility on grand staff improved

## [1.6.0] - 2026-03-15

### Added
- Grand staff: tempo input, scale selector (19 keys), time signature selector (4/4, 3/4, 2/4, 6/8)
- Grand staff: key signature accidentals (sharps/flats) drawn on staff lines per selected scale
- Grand staff: time signature numbers displayed left of staff
- Grand staff: flowing measure bar lines scrolling right-to-left at tempo speed
- Grand staff: beat subdivision lines within measures
- Grand staff: play line (green) marking where notes should be played
- Grand staff: target notes system — hollow note heads flowing from right to play line
- Waterfall: target notes flowing down from top as outlined rectangles
- Practice curriculum framework in IDEAS.md (Stage 1: single finger)

### Changed
- Grand staff: played notes now appear at play line, history scrolls left (was: fixed position, history scrolled right)
- Grand staff: accidentals respect key signature (only shown for notes outside the key)
- Camera off by default — only activates when device receives camera role

## [1.5.2] - 2026-03-15

### Fixed
- Gemini model name: `gemini-2.5-flash-preview-native-audio-dialog` → `gemini-2.5-flash-native-audio-latest` (old name removed by Google, caused instant session close loop)
- Camera off by default — only activates on device with camera role assigned

### Added
- QR code button in room bar for easy secondary device onboarding
- `activateCamera()` function for role-based camera activation

## [1.5.1] - 2026-03-15

### Added
- Grand staff visualization between piano roll and keyboard
- Better Gemini Live session close/error logging for diagnostics

## [1.5.0] - 2026-03-15

### Removed
- Scoring & gamification: score display, quest journey map (5 phases), achievement badges (7 types), story scene cards (8 scenes)
- Tools: `set_scene`, `award_badge`, `advance_quest` — agent now uses only `set_coaching_focus` and `report_technique`
- All scene-specific CSS gradients and achievement popup animations

### Changed
- Device Manager: simplified from interactive toggle pills to read-only role tags
- System instruction: streamlined to reference only 2 tools, conversation-first coaching focus
- Frontend: cleaner UI focused on coaching panels, piano roll, and hand tracking

## [1.4.0] - 2026-03-15

### Added
- Dynamic Device Role Management: any device connects to unified `/ws/session` endpoint
  - First device becomes primary (creates Gemini session, shows full UI + Device Manager panel)
  - Subsequent devices join as secondary with `?room=CODE` parameter
  - Primary device gets Device Manager panel showing all connected devices with role tags
  - Three exclusive roles per device: MIC, CAM, MIDI — server-enforced, no overlap
  - Secondary devices show minimal role-indicator UI, activate hardware on role assignment
  - Secondary mic: getUserMedia audio with energy gate, downsample to 16kHz PCM
  - Secondary camera: rear-facing camera, 1fps JPEG frames to Gemini
  - Secondary MIDI: Web MIDI API forwarding to Gemini + room devices
  - All devices receive audio playback + output events from Gemini
- Room code "Copy Link" button for easy device onboarding
- Auto-detect device type from User-Agent (desktop/tablet/phone) with icons
- Role hint via URL parameter: `?room=CODE&role=camera` auto-assigns role on connect
- `room_closed` message to gracefully disconnect secondaries when primary leaves
- Backwards compatible: `/ws/dialog`, `/ws/camera`, `/ws/midi`, `/ws/spectator` still work

## [1.3.1] - 2026-03-15

### Fixed
- Mic audio energy gate: skip silent chunks (RMS < 0.01) so Gemini's automatic activity detection triggers end-of-speech correctly (cross-app fix from BookSage)

## [1.3.0] - 2026-03-15

### Added
- 3-device demo architecture: Ubuntu (MIDI) + iPad (primary UI) + iPhone (camera)
  - `/ws/midi?room=CODE` WebSocket path for MIDI bridge connections
  - Server buffers MIDI events and flushes to Gemini as snapshots every 2 seconds
  - Server forwards raw MIDI events to iPad for waterfall/dynamics visualization
  - iPad handles incoming `midi` messages from WebSocket for remote MIDI rendering
- `scripts/midi-relay.js` — relay script connecting pianoquest-bridge (:3491) to Cloud Run
- Room session now includes `sendClientContent` and `primaryWs` for cross-device data routing

## [1.2.0] - 2026-03-15

### Added
- Remote camera mode: phone at piano sends camera frames to iPad's Gemini session
  - `/ws/camera?room=CODE` WebSocket path for camera-only connections
  - Room-based session sharing: primary client gets a 4-char room code on connect
  - `?camera=1&room=CODE` on index.html: minimal camera viewfinder UI, rear-facing camera, 1fps JPEG
  - Room code displayed in primary client status bar
- Health endpoint shows active room count

## [1.1.0] - 2026-03-14

### Added
- Spectator mode: connect to `?spectator=1` to watch a live session from another device
  - New `/ws/spectator` WebSocket path receives all output (audio, tool events, transcripts)
  - Spectator UI hides camera/mic controls, auto-connects, plays audio and shows all visual panels
  - Primary session broadcasts all Gemini output to connected spectators
- Health endpoint now shows spectator count

## [1.0.1] - 2026-03-14

### Fixed
- Removed bothHandsDetected guard from showTechniqueReport() — trust model judgment, prevent report swallowing during brief tracking drops
- Mic audio quality: capture at native sample rate and downsample to 16kHz (cross-app fix from JayWalks Live)

### Changed
- Conversation-first system prompt: shorter responses (1-2 sentences), natural flow, tools used sparingly
- Updated demo script for v1.0.0 architecture

## [1.0.0] - 2026-03-12

### Changed
- **BREAKING**: Migrated entire backend from Python (FastAPI + ADK Python) to TypeScript (Express + ws + @google/genai)
  - Runtime: Python 3.11 → Node.js 20
  - Server: FastAPI WebSocket → Express + `ws` library
  - AI: ADK `Runner.run_live()` → `@google/genai` `client.live.connect()` (ADK TS v0.5 lacks `runLive`)
  - Tools: Python functions with `contextvars` → manual `functionDeclarations` + local execution
  - Dockerfile: python:3.11-slim → node:20-slim
- All 5 tools preserved: set_scene, award_badge, set_coaching_focus, advance_quest, report_technique
- WebSocket protocol unchanged — frontend (static/index.html) requires no changes
- System instruction preserved verbatim

### Added
- `src/index.ts` — entry point
- `src/agent/agent.ts` — tool definitions, system instruction, ADK LlmAgent (structural)
- `src/agent/server.ts` — Express + WebSocket + Gemini Live API integration
- `package.json`, `tsconfig.json` — TypeScript project config
- ADK FunctionTool definitions with Zod schemas (for future `runLive` support)

### Removed
- `agent/agent.py`, `agent/server.py`, `agent/__init__.py`, `agent/__main__.py`
- `requirements.txt`

## [0.4.7] - 2026-03-12

### Added
- `report_technique` tool for vision-audio correlation reporting
- Finger Tracking UI panel

### Changed
- Increased video frame rate from every 2 seconds to every 1 second

## [0.4.0] - 2026-03-11

### Changed
- **BREAKING**: Replaced frontend keyword matching with genuine ADK tool calls
  - Agent now calls `set_scene()`, `award_badge()`, `set_coaching_focus()`, `advance_quest()` tools
  - Gemini DECIDES when to trigger visual changes — not frontend string matching
  - Visual events flow: Gemini → tool call → contextvars queue → WebSocket → frontend
- Removed `google_search` tool (unused), replaced with 4 visual control tools
- Rewrote agent prompt to instruct tool usage patterns throughout session arc
- Frontend handles tool-driven WebSocket messages instead of parsing transcripts

### Removed
- `detectScene()`, `detectAchievement()`, `detectQuestPhase()`, `detectCoachingTip()` keyword functions
- `QUEST_KEYWORDS` array
- Scene vocabulary and achievement phrase sections from prompt (replaced by tool docs)

## [0.3.0] - 2026-03-11

### Added
- Story Scene Cards: 8 themed visual environments driven by narrative
- Coaching Focus Card: technique tips parsed from agent speech
- Achievement Badges: 7 animated milestone popups
- Quest Journey Map: 5-phase narrative arc visualization
- Technique Score: composite dynamics + rhythm accuracy score (0-100)
- Score trend indicator (up/down arrows)
- Full dark theme with architecture diagram color palette

## [0.2.0] - 2026-03-11

### Added
- Blog post for Gemini Live Agent Challenge (`docs/blog-post.md`) covering 3x8 multimodal architecture
- Full piano coaching + creative storyteller agent prompt (multimodal aware: vision + audio + voice)
- Camera capture: sends JPEG frames to Gemini vision every 2s for finger/technique analysis
- Audio capture: 16kHz PCM streaming to Gemini for piano + voice recognition
- Audio playback: 24kHz PCM agent voice output with gapless scheduling
- MIDI Dynamic Bars visualization: 48-band frequency analysis with piano-range mapping
- Rhythm Accuracy Grid: onset detection + BPM-aligned grid with color-coded timing accuracy
- Level meter: real-time audio input level display
- Full dark theme UI matching architecture diagram color palette
- Video frame handling in WebSocket server (base64 JPEG → Gemini Live API)

### Changed
- Agent voice from Aoede to Puck (warmer, more narrative)
- Agent prompt from generic storyteller to piano coaching + creative storytelling hybrid

## [0.1.0] - 2026-03-11

### Added
- Initial project scaffolding
- ADK agent with Creative Storyteller mode
- FastAPI + WebSocket server (same pattern as JDialogs Copilot)
- Placeholder UI
- Cloud Run deployment scripts
- Version control files (VERSION, CHANGELOG, BUGS, IDEAS)
