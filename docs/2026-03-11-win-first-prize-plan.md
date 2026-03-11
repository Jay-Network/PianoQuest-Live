# Plan: How PianoQuest Live Wins First Prize

**Category:** Creative Storyteller ($10K + potential $25K Grand Prize)
**Judging:** Innovation & Multimodal UX 40% | Technical 30% | Demo 30%

---

## The Gap

Current PianoQuest outputs: **voice + transcript only**.
MIDI bars and rhythm grid analyze USER input — not agent output.

Creative Storyteller judges want: **interleaved multimodal OUTPUT** — the agent
weaving text, images, audio, and visual elements into one fluid stream.

## The Fix: 5 Interleaved Output Modalities

### 1. Story Scene Cards (Visual Output)
Pre-built illustrated scene cards (CSS/SVG) that the agent triggers through its narration.
6-8 scenes: enchanted_forest, rhythm_dragon, crystal_cave, technique_tower,
harmony_garden, victory_hall, shadow_passage, sunrise_peak.

**How:** Agent prompt includes scene vocabulary. Frontend keyword-detects on
output transcripts ("enchanted forest", "rhythm dragon") and transitions to
matching scene with smooth animation. Scene card appears above the MIDI bars.

**Why it wins:** The agent's VOICE drives VISUAL changes. True interleaved output.

### 2. Coaching Focus Card (Text Output)
Dedicated card showing current coaching instruction as styled text.
Updates when agent gives a new tip. Persists until next instruction.

Example: "Focus: Even dynamics on C-E-G — whisper the C, speak the E, whisper the G"

**How:** Parse output transcript for coaching patterns. Display in a styled card
between scenes and visualizations.

**Why it wins:** Text output interleaved with audio. Judges see text+audio working together.

### 3. Achievement System (Visual + Text Output)
Animated badge popups when agent awards achievements. Trophy shelf accumulates badges.
Achievements: "Resonant Triad", "Steady Pulse", "The Singing Legato", "Dragon Slayer".

**How:** Agent narrates "achievement unlocked" or "you've earned the X badge."
Frontend detects and renders animated badge entrance.

**Why it wins:** Gamification layer + visual output driven by agent narration.
Shows progression quantitatively.

### 4. Session Progress Score (Data Visualization Output)
Real-time technique score (0-100) that quantifiably shows improvement.
Components: dynamics evenness, rhythm accuracy, consistency over time.
Computed client-side from audio analysis, displayed prominently.

**How:** Rolling average of MIDI bar evenness + rhythm grid accuracy.
Large number display with trend arrow. Agent references the score in coaching.

**Why it wins:** QUANTIFIABLE improvement visible in the demo. Judges can see
the number go from ~40 to ~85 during the session. This is the "visible improvement"
proof that sells the demo arc.

### 5. Quest Journey Map (Visual Narrative Output)
A horizontal quest path showing the session's narrative arc.
Chapters light up as completed. Current position pulses.
Shows: Opening → Assessment → Challenge → Mastery → Celebration.

**How:** Simple SVG path with milestone nodes. Agent's scene transitions advance
the map position. Completed nodes show achievement badges.

**Why it wins:** Makes the NARRATIVE STRUCTURE visible. The creative storytelling
isn't just voice — it's a visual journey the viewer can follow.

---

## What Makes PianoQuest Unique vs. Competitors

Most Creative Storyteller entries will do: text input → multimodal output.
PianoQuest does: **multimodal input → multimodal output**.

| Input | Output |
|-------|--------|
| Camera (vision of fingers) | Voice (coaching narration) |
| Piano audio (notes/dynamics) | Story scenes (visual narrative) |
| Voice (user speech) | Coaching cards (text instructions) |
| | Achievement badges (visual progress) |
| | MIDI bars (audio-driven visualization) |
| | Rhythm grid (timing visualization) |
| | Progress score (quantified improvement) |
| | Quest map (narrative arc visualization) |

**3 inputs × 8 outputs = dense multimodal experience**

## Differentiators for Grand Prize

1. **Bidirectional multimodal** — Most entries take text, output rich media.
   We take 3 live input streams and produce 8 interleaved output streams.
2. **Real-time streaming** — No turn-taking. Continuous live coaching during playing.
3. **Quantifiable improvement** — Progress score PROVES coaching works. Demo arc
   is not subjective — the number goes up.
4. **Production quality** — Dark theme, consistent design language, smooth animations.
   Feels like a product, not a hackathon demo.
5. **The story IS the coaching** — Not bolted-on narrative. Every scene, achievement,
   and coaching card IS the teaching. Story and pedagogy are inseparable.

## Bonus Points (up to 1.0 extra)

- [ ] Blog post with #GeminiLiveAgentChallenge (0.6)
- [x] Automated cloud deployment via cloudbuild.yaml (0.2)
- [ ] GDG membership link (0.2) — Ask Jay

## Implementation Plan

### v0.3.0 — Interleaved Multimodal Output
1. Story scene cards (CSS/SVG illustrations + transition animations)
2. Coaching focus card (parsed from transcript)
3. Achievement badges (animated popups + trophy shelf)
4. Session progress score (dynamics evenness + rhythm accuracy)
5. Quest journey map (SVG milestone path)
6. Updated agent prompt (use scene names, award achievements, frame coaching tips)
7. Updated frontend layout (accommodate new visual elements)

### Estimated effort
- Scene card CSS/SVG: 2 hours (can delegate to Codex for individual card designs)
- Achievement system: 1 hour
- Progress score: 30 min (already have MIDI bar + rhythm data)
- Quest journey map: 1 hour
- Agent prompt update: 30 min
- Frontend layout rework: 1 hour
- Testing + polish: 2 hours
- **Total: ~8 hours**

### Layout revision
```
┌────────────────────────────────────────────────────────────┐
│  🎹 PianoQuest Live          Score: 67 ↑    [Start] [Stop] │
├────────────────────────────────────────────────────────────┤
│  Quest: ○──●──○──○──○  Chapter 2: The Rhythm Dragon        │
├──────────────┬─────────────────────────────────────────────┤
│              │  ┌─────────────────────────────────────┐    │
│  📹 Camera   │  │  🏰 STORY SCENE                      │    │
│              │  │  [Illustrated scene card with mood   │    │
│  (fingers)   │  │   lighting matching the narrative]   │    │
│              │  └─────────────────────────────────────┘    │
│              ├─────────────────────────────────────────────┤
│  Focus:      │  🎵 Dynamic Response                        │
│  Even C-E-G  │  ████████████████████                       │
│  dynamics    ├─────────────────────────────────────────────┤
│              │  ⏱ Rhythm Accuracy                          │
│  🏆 Badges:  │  · · | · · | · · | · ·                     │
│  ⭐⭐         │                                             │
├──────────────┴─────────────────────────────────────────────┤
│  💬 Conversation                                            │
│  PIANOQUEST: Welcome to the Enchanted Forest...             │
│  YOU: Help me even out this triad                           │
└────────────────────────────────────────────────────────────┘
```
