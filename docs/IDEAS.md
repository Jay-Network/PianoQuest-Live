# PianoQuest Live — Ideas Tracker

## Format
Each idea: ID, version proposed, severity (major/minor), status, description.

---

## Practice Stages (Curriculum)

### Stage 1: Single Finger
- **1-1. Single Finger Tempo** — Play a single note (e.g. C) at a regular interval (e.g. 100 BPM). Target notes flow down the waterfall and across the grand staff.
- **1-2. Single Finger Strength** — Play a note at a specific dynamic level (e.g. mp). Gemini evaluates velocity accuracy.
- *(More variations TBD — articulation, different fingers, different registers)*

### Stage 2: TBD
### Stage 3: TBD

---

**IDEA: Cross-session memory (from BookSage cross-pollination)**
- **Version:** 0.4.6
- **Status:** proposed
- **Severity:** minor
- **Description:** Remember what songs/exercises the student practiced in previous sessions. Enable coaching like 'Last time you struggled with that C-to-G transition — try again.' Would require persisting session data to Firestore or Cloud SQL. Low priority for competition deadline but high value for post-launch.

**IDEA: Gamification — Scoring & Technique Score**
- **Version:** 1.5.0
- **Status:** proposed (stripped in v1.5.0, re-add post-competition)
- **Severity:** minor
- **Description:** Composite dynamics + rhythm accuracy score (0-100) with trend indicator (up/down arrows). Originally in v0.3.0. Re-implement once coaching basics are solid.

**IDEA: Gamification — Quest Journey Map**
- **Version:** 1.5.0
- **Status:** proposed (stripped in v1.5.0)
- **Severity:** minor
- **Description:** 5-phase narrative arc visualization (Discovery, First Challenge, Deep Dive, Mastery, Finale). `advance_quest` tool lets agent progress the user through phases. Requires `advance_quest` tool re-added to agent.

**IDEA: Gamification — Achievement Badges**
- **Version:** 1.5.0
- **Status:** proposed (stripped in v1.5.0)
- **Severity:** minor
- **Description:** 7 animated milestone popups (First Note, Smooth Sailing, Dynamics Explorer, Speed Demon, Pattern Master, Bridge Builder, Virtuoso). `award_badge` tool lets agent grant badges. Requires `award_badge` tool re-added to agent.

**IDEA: Gamification — Story Scene Cards**
- **Version:** 1.5.0
- **Status:** proposed (stripped in v1.5.0)
- **Severity:** minor
- **Description:** 8 themed visual environments driven by narrative (forest, ocean, castle, space, garden, volcano, crystal, storm) with CSS gradient backgrounds. `set_scene` tool lets agent switch scenes. Requires `set_scene` tool re-added to agent.

**IDEA: Camera + Finger Tracking (stripped in v2.1.0, re-add post-competition)**
- **Version:** 2.1.0
- **Status:** implemented (v3.1.0)
- **Implementation version:** 3.1.0
- **Severity:** major
- **Description:** MediaPipe hand tracking overlay, camera panel, report_technique tool (vision+audio correlation), video frame sending to Gemini, standalone phone camera mode, multi-device camera role. Full restoration guide: `docs/removed-camera-finger-tracking.md`. Re-implemented with hybrid approach: MediaPipe HandLandmarker runs client-side on phone for skeleton overlay, JPEG frames sent at 1fps to Gemini for vision coaching. Camera role in multi-device system. Finger tracking panel on primary shows technique reports.

**IDEA: Music notation symbols — rests, note types, expressions, pedal signs**
- **Version:** 2.1.5
- **Status:** proposed
- **Severity:** major
- **Description:** Add comprehensive music notation to the score renderer: rest symbols (whole through sixteenth), note duration types (whole/half/quarter/eighth with proper heads, stems, flags, beams), expression marks (staccato, legato, accent, tenuto, fermata, marcato), tempo markings, ornaments (trill, mordent, turn, grace notes), and pedal signs (Ped./asterisk, bracket notation). Reference doc at `docs/music-notation-reference.md`.

**IDEA: Fix Fur Elise digital sheet music**
- **Version:** 2.1.5
- **Status:** proposed
- **Severity:** minor
- **Description:** Current `sheets/classical/fur-elise.json` has incorrect notation. Need to match a real reference sheet (requested from jayhub:31). Digital version should look exactly like a proper published score.

**IDEA: Custom desktop UI for VoiceLauncher integration**
- **Version:** 0.4.7
- **Status:** proposed
- **Severity:** minor
- **Description:** VoiceLauncher v0.3.0 opens PianoQuest in Chrome app mode via 'Maestro' voice command. Build a dedicated desktop UI optimized for Jay's daily piano practice on Ubuntu. VoiceLauncher handles mic/audio routing; custom UI focuses on finger tracking panel, score display, and scene visuals. Competition app stays as-is — this is a separate layout for personal use. Consider: larger finger tracking panel, session history sidebar, exercise library from PianoQuest app.

**IDEA: Timestamp-based MIDI playback scheduling for remote listeners**
- **Version:** 3.2.46
- **Status:** proposed
- **Severity:** major
- **Description:** Remote spectators (e.g. jayismocking.com/live via PQ Stream bridge) hear choppy audio for fast/complex pieces (Chopin Fantaisie Impromptu). Root cause: MIDI events arrive with network jitter but Tone.js plays them immediately on arrival, destroying temporal relationships between notes. Solution: use the existing `timestampMs` field on MIDI events to schedule Tone.js playback at correct relative offsets, absorbing jitter into a small buffer.

  **Architecture:**
  ```
  Producer (PQ Live desktop) → timestampMs on each MIDI event
  → WebSocket → PQ Stream bridge → WebSocket → Spectator browser
  → Spectator: schedule Tone.js at (firstPlayTime + (eventTs - firstEventTs)/1000)
  ```

  **Configuration parameters:**
  - `PLAYBACK_BUFFER_MS` (default: 150ms) — intentional delay added to all events to absorb jitter. Higher = smoother but more latency. Range: 50-500ms.
  - `DRIFT_CORRECTION_INTERVAL_MS` (default: 10000ms) — how often to check clock drift between producer timestamps and local clock. Gradually adjust anchor to prevent cumulative drift.
  - `MAX_DRIFT_MS` (default: 500ms) — if drift exceeds this, hard-reset the anchor (brief audio glitch but recovers sync).
  - `ANCHOR_RESET_EVENTS`: reset `firstEventTs`/`firstPlayTs` on: WebSocket reconnect, 3+ seconds of silence (new phrase), explicit reset message from producer.

  **Implementation steps:**
  1. Spectator receives first MIDI event → stores `firstEventTs = msg.timestampMs`, `firstPlayTs = Tone.now() + PLAYBACK_BUFFER_MS/1000`
  2. Subsequent events: `scheduledTime = firstPlayTs + (msg.timestampMs - firstEventTs) / 1000`
  3. `playAt = Math.max(Tone.now(), scheduledTime)` — never schedule in the past
  4. Every `DRIFT_CORRECTION_INTERVAL_MS`: measure `expectedNow = firstPlayTs + (latestTs - firstEventTs)/1000` vs `Tone.now()`. If drift > threshold, nudge anchor.
  5. On silence gap > 3s or reconnect: reset anchors so next phrase starts fresh.

  **Affects:** jayismocking.com/live (PQ Stream spectator), any future spectator clients. Does NOT affect PQ Live desktop (plays locally with no delay).

