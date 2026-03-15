# PianoQuest Live — Demo Video Script (v1.0.0)

**Duration:** 3 minutes (strict)
**Arc:** Bad playing → Coaching with EYE/EAR reports → Visible improvement
**Judging:** Innovation 40% | Technical 30% | Demo 30%
**Narrative:** "AI that makes you a better musician"

---

## Opening — The Hook (0:00 - 0:15)

**Visual:** Browser opens PianoQuest Live. Full UI visible.
**Voiceover:** "What if an AI could watch your hands, hear your music, and coach you in real time — connecting what it sees to what it hears?"

**Action:** Click "Start Session." Camera activates. Hands visible on keyboard.

---

## Act 1 — Bad Playing + First Report (0:15 - 0:50)

**Player:** Plays C major triad with uneven dynamics. E too soft, G too hard.

**Agent:** Greets briefly, observes, then coaches: "I can see your 3rd finger collapsing — and the E is getting buried."

**Tool calls fire:**
- `set_scene("enchanted_forest")` — scene card changes
- `advance_quest(0)` then `advance_quest(1)` — quest map progresses
- `report_technique` — **THE WOW MOMENT:**
  - EYE: "3rd finger collapsing at first knuckle"
  - EAR: "E note noticeably softer than C and G"
  - Suggestion: "Curve fingertip, press from knuckle arch"
- `set_coaching_focus("Curve your 3rd finger — lead with the fingertip")`

**Show:** Technique panel with EYE/EAR labels. Score ~40. Badge: "first_note".

---

## Act 2 — Iterative Coaching (0:50 - 1:45)

**Player (voice):** "Like this?" — tries again, slightly better.

**Agent:** "Better! The E is waking up. Try it once more."

**Second `report_technique`:**
- EYE: "fingertip more curved than before"
- EAR: "E velocity closer to C and G — gap narrowing"
- Shows CHANGE from previous attempt

**Player:** Third attempt — more even.

**Agent:** "Yes! Did you feel that? Much more balanced."

**Third `report_technique`:**
- EYE: "good finger arch maintained"
- EAR: "velocities within 10% — even triad"

**What viewer sees:**
- 3 technique reports stacking in panel (EYE/EAR for each attempt)
- Score climbing: 40 → 55 → 70
- `advance_quest(2)` — quest at Challenge
- `set_scene("technique_tower")`

---

## Act 3 — Breakthrough (1:45 - 2:30)

**Player:** Plays triad evenly. Then C-F-G-C progression with consistent dynamics.

**Agent:** "That chord rang like a bell."

**Tool calls:**
- `award_badge("even_triad")` — animated badge popup
- `set_scene("sunrise_peak")`
- `advance_quest(3)` — quest at Mastery
- `report_technique` showing before/after: "fingers curved, velocities balanced, clean legato transition"

**Score hits 85.** Trend arrow green.

---

## Wrap-Up (2:30 - 2:50)

**Agent:** "Beautiful journey. From uneven chords to a resonant voice."

- `award_badge("chapter_complete")`
- `set_scene("victory_hall")`
- `advance_quest(4)` — all phases complete

**Player:** "I could actually feel the improvement."

---

## End Card (2:50 - 3:00)

Show: Final score (~85), 4-5 EYE/EAR technique reports in panel, all badges, quest map fully lit.

**Text overlay:**
- "PianoQuest Live — AI that makes you a better musician"
- "Vision + MIDI + Voice → Real-time coaching"
- "Gemini 2.5 Flash Native Audio + Google ADK TypeScript"
- "Google Cloud Run"
- GitHub URL

---

## Key Moments for Judges

1. **0:30** — First `report_technique` with EYE/EAR structured data (proves real multimodal fusion)
2. **1:15** — Second report showing CHANGE from previous attempt (proves iterative coaching)
3. **1:45** — Score improvement visible (quantifiable: 40→85)
4. **2:10** — Badge awarded for genuine improvement (not scripted)
5. **Throughout** — Agent voice is natural, 1-2 sentences, not lecturing

## Demo Tips

- Well-lit keyboard for clear camera view
- Exaggerate "bad" playing (very uneven dynamics)
- Speak clearly to the agent
- Keep the full UI in frame
- BPM slider at 90
- The EYE/EAR technique panel is the centerpiece — make sure it's visible
