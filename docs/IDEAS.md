# PianoQuest Live — Ideas Tracker

## Format
Each idea: ID, version proposed, severity (major/minor), status, description.

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

**IDEA: Custom desktop UI for VoiceLauncher integration**
- **Version:** 0.4.7
- **Status:** proposed
- **Severity:** minor
- **Description:** VoiceLauncher v0.3.0 opens PianoQuest in Chrome app mode via 'Maestro' voice command. Build a dedicated desktop UI optimized for Jay's daily piano practice on Ubuntu. VoiceLauncher handles mic/audio routing; custom UI focuses on finger tracking panel, score display, and scene visuals. Competition app stays as-is — this is a separate layout for personal use. Consider: larger finger tracking panel, session history sidebar, exercise library from PianoQuest app.

