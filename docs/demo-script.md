# PianoQuest Live — Demo Video Script (v0.3.0)

**Duration:** 3-4 minutes (max 4:00)
**Arc:** Bad playing → Coaching → Visible improvement
**Judging:** Innovation 40% | Technical 30% | Demo 30%

---

## Opening — The Hook (0:00 - 0:20)

**Visual:** Dark screen. Piano chord sound. PianoQuest Live logo fades in.
**Voiceover:** "What if your piano playing could tell a story? What if an AI could see your hands, hear your music, and coach you in real time — all through creative narrative?"

**Action:** Browser opens. Full UI visible: quest map, scene card ("Your Quest Awaits"), empty achievement shelf, technique score showing "--".

---

## The Problem (0:20 - 0:35)

**Voiceover:** "Music practice apps score notes right or wrong. They don't make music meaningful. PianoQuest Live changes that — it turns every practice session into an interactive quest."

**Action:** Click "Start Session." Camera activates showing hands on keyboard. Status dot turns green. Level meter starts responding.

---

## Act 1 — Bad Playing (0:35 - 1:15)

**Player:** Plays C major triad with uneven dynamics (loud C, quiet E, loud G). Rhythm slightly off.

**What the viewer sees:**
- **MIDI bars** show uneven heights (visual proof of imbalance)
- **Rhythm grid** shows amber/red dots (off-beat)
- **Technique score** appears: ~35-45
- **Quest map** stays at "Opening"

**Agent (voice):** Greets warmly. "Welcome to the Harmony Garden — here, every note in your chord must bloom equally." Observes: "I can see your middle finger is flatter than the others, and I can hear the E getting lost."

**What changes:**
- **Scene card** transitions to "Harmony Garden" (green gradient)
- **Quest map** advances to "Assessment" (line turns green)
- **Coaching focus card** updates: "Try curving your middle finger more to get weight on the E"
- **"First Note" badge** appears with animated popup

---

## Act 2 — Coaching (1:15 - 2:15)

**Player (voice):** "How can I make the E louder without hitting it harder?"

**Agent (voice):** "Imagine you're whispering the C, speaking the E, and whispering the G. The E needs more finger weight, not more force. Try leading with your fingertip."

**What changes:**
- **Coaching focus** updates with the tip
- **Quest map** advances to "Challenge"
- **Scene** may shift to "Technique Tower" if agent mentions technique

**Player:** Tries again. Second attempt slightly better.

**Agent:** "Better! I can hear the E waking up. Your wrist dropped a bit on that stretch though — try keeping it level."

**Player:** Third attempt — more even.

**Agent:** "Yes! Did you feel that difference? That chord is starting to sing as one voice."

**What the viewer sees:**
- **MIDI bars** becoming more uniform with each attempt
- **Technique score** climbing: 45 → 55 → 65
- **Score trend arrow** appears (green up arrow)
- **Rhythm grid** dots becoming greener

---

## Act 3 — Breakthrough (2:15 - 2:50)

**Player:** Plays the triad with good evenness. Then plays a short progression (C-F-G-C) with consistent dynamics.

**Agent:** "That chord rang like a bell! You've earned the Resonant Triad. The Harmony Garden is in full bloom."

**What the viewer sees (the money shots):**
- **Technique score** hits 78-85+ (turns green)
- **"Resonant Triad" achievement** pops up with animation
- **Scene** transitions to "Sunrise Peak" (warm orange gradient)
- **Quest map** advances to "Mastery"
- **MIDI bars** showing even, consistent response
- **Rhythm grid** mostly green dots on-beat

---

## Wrap-Up (2:50 - 3:20)

**Agent:** "Chapter complete! From uneven chords to a resonant voice — what a journey. You've conquered the Harmony Garden."

**What changes:**
- **"Chapter Complete" badge** popup
- **Quest map** reaches "Celebration" — all nodes green
- **Scene** transitions to "Victory Hall" (gold gradient)

**Player (voice):** "That was amazing. I could actually feel the improvement."

---

## Tech Walkthrough (3:20 - 3:50)

**Visual:** Architecture diagram (docs/architecture.svg) or overlay on the app.

**Voiceover / text overlay:**
- "3 multimodal inputs: Camera + Piano Audio + Voice"
- "8 interleaved outputs: Voice, Scenes, MIDI Bars, Rhythm Grid, Score, Coaching, Achievements, Quest Map"
- "Powered by Gemini 2.5 Flash Live API + Google ADK"
- "Deployed on Google Cloud Run"
- "Real-time WebSocket streaming — no turn-taking"

---

## End Card (3:50 - 4:00)

**Visual:** PianoQuest Live logo, final technique score, all earned badges.

**Text:**
- "PianoQuest Live — Creative Musical Storytelling"
- "Gemini Live Agent Challenge — Creative Storyteller"
- GitHub URL
- "Built by Jay — MIT · STEM Educator"
- #GeminiLiveAgentChallenge

---

## Key Moments to Capture

1. **Scene transition** — the gradient change when agent says "Harmony Garden"
2. **Achievement popup** — the animated badge sliding in
3. **Score climbing** — technique score going from 35 to 85
4. **Quest map progression** — nodes lighting up green
5. **MIDI bars evening out** — visual proof of dynamics improvement
6. **Agent referencing vision** — "I can see your middle finger is flatter"

## Demo Tips

- Use a well-lit keyboard for clear camera view
- Exaggerate the "bad" playing initially (very uneven dynamics)
- Speak clearly when talking to the agent
- Show the full UI in frame so all 8 output modalities are visible
- Keep BPM slider at 90 for the demo
- Consider split screen: webcam of hands + app UI
