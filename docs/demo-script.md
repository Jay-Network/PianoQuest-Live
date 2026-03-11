# PianoQuest Live — Demo Video Script

**Duration:** 2-3 minutes
**Arc:** Bad playing → Coaching → Visible improvement
**Judging:** Innovation 40% | Technical 30% | Demo 30%

---

## Opening (0:00 - 0:15)

**Visual:** Browser opens to PianoQuest Live dark UI. Camera shows hands on piano keyboard.
**Voiceover:** "PianoQuest Live is an AI piano coach that sees your hands, hears your playing, and speaks to you in real time — turning practice into a creative quest."

**Action:** Click "Start Session." Status dot turns green. MIDI bars appear idle.

---

## The Problem — Bad Playing (0:15 - 0:45)

**Visual:** Camera on fingers. Player attempts a C major triad with uneven dynamics (loud C, quiet E, loud G). MIDI bars show uneven heights.

**Agent (voice):** Greets the user. Acknowledges what it sees and hears. Names the session "Chapter 1: The Quest for the Resonant Triad."

**Player (voice):** "I want to make this triad sound more even. The E keeps getting lost."

**Key visuals to highlight:**
- MIDI bars clearly show uneven frequency response
- Rhythm grid shows timing dots (may be slightly off-grid)
- Camera preview showing hand position
- Transcript populating in real-time

---

## Coaching Phase (0:45 - 1:30)

**Agent coaches** based on what it sees AND hears:
- "I can see your middle finger is flatter than the others — try curving it more to get more weight on the E"
- "Play it again, but imagine you're whispering the C, speaking the E, and whispering the G"
- Player tries again → agent gives real-time micro-feedback

**Key moments:**
- Agent references BOTH visual (finger position) and audio (note balance)
- Coaching is specific and actionable
- Storytelling framing maintained ("The E is waking up!")

---

## Improvement — Visible Progress (1:30 - 2:00)

**Visual:** Player tries again with improved technique. MIDI bars become more uniform. Rhythm grid shows dots aligning closer to beat lines (green dots).

**Agent:** "Yes! Did you feel that? The E rang out this time — your triad is singing as one voice now."

**Key visuals:**
- MIDI bars visibly more even than before (side-by-side improvement)
- Rhythm grid showing green on-beat dots
- Player's hand position improved (curved fingers)

---

## Wrap-Up (2:00 - 2:30)

**Agent:** Summarizes the session — "Chapter 1 complete. You've unlocked the Resonant Triad."

**Voiceover/text overlay:**
- "3 modalities: Vision + Audio + Voice"
- "Real-time MIDI visualization"
- "Powered by Gemini 2.5 Flash Live API + Google ADK"
- "Built for the Gemini Live Agent Challenge"

**End card:** PianoQuest Live logo, URL, "Built by Jay — MIT · STEM Educator"

---

## Technical Highlights to Emphasize

1. **Multimodal input:** Camera sees fingers, mic hears piano + voice simultaneously
2. **Real-time streaming:** No turn-taking delay — agent responds during natural pauses
3. **Visual feedback:** MIDI dynamic bars + rhythm accuracy grid update in real-time
4. **Creative framing:** Practice sessions as narrative quests (Creative Storyteller category)
5. **Architecture:** Gemini Live API → ADK → WebSocket → browser, deployed on Cloud Run

## Demo Tips

- Use a well-lit keyboard for clear camera view
- Exaggerate the "bad" playing initially (very uneven dynamics)
- Speak clearly when talking to the agent
- Point out the MIDI bars and rhythm grid changes to the viewer
- Keep BPM slider visible during rhythm work
