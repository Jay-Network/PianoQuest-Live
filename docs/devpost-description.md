# PianoQuest Live — Devpost Submission

## Inspiration

Music practice is mechanical. Apps score notes right or wrong but never make music *meaningful*. Yet music and storytelling are natural partners — film scores prove it. We asked: what if an AI could see your hands on the piano, hear your playing, and coach you through an interactive story in real time?

## What it does

PianoQuest Live is a real-time AI piano coach that turns practice into a creative quest. Point your camera at the keyboard, play piano, and talk to the AI — it responds with voice coaching wrapped in narrative storytelling, while the screen fills with visual feedback.

**3 multimodal inputs:**
- Camera sees finger position and technique
- Microphone hears piano notes, dynamics, and rhythm
- Voice captures the user's goals and questions

**8 interleaved outputs:**
- Voice narration (real-time coaching in a storyteller persona)
- Story scene cards (8 themed environments that shift with the narrative)
- MIDI dynamic bars (frequency analysis showing key strength)
- Rhythm accuracy grid (onset timing vs. BPM grid)
- Technique score (real-time 0-100 quantified improvement)
- Coaching focus card (current instruction as styled text)
- Achievement badges (animated milestones like "Resonant Triad")
- Quest journey map (5-phase narrative arc visualization)

The demo arc: a user plays a C major triad with uneven dynamics (score ~40). The agent sees flat fingers and hears the imbalance. It coaches specific technique fixes while framing the session as "The Harmony Garden." After a few attempts, the MIDI bars even out, the score climbs to ~85, and the agent awards the "Resonant Triad" achievement. Quantifiable improvement, visible on screen.

## How we built it

- **Gemini 2.5 Flash** (native audio + vision) via the Live API processes camera frames and audio simultaneously in a single context window
- **Google ADK** (Agent Development Kit) handles the streaming runtime — LiveRequestQueue routes WebSocket audio/video to the model
- **FastAPI + WebSocket** server streams 16kHz PCM audio and JPEG frames from browser to ADK, and 24kHz voice audio back
- **Web Audio API** performs client-side frequency analysis for MIDI bars and onset detection for the rhythm grid
- **Canvas** renders all visualizations at 60fps
- **Cloud Run** hosts the containerized application with session affinity
- **Cloud Build** provides automated CI/CD deployment

The agent prompt combines music pedagogy with creative storytelling — it uses "scene vocabulary" (phrases like "harmony garden" or "rhythm dragon") that the frontend detects in transcripts to trigger visual scene transitions and achievement popups.

## Challenges we ran into

- **Audio feedback loops**: The agent's voice output would feed back into the microphone. Solved by disabling echo cancellation and noise suppression so the raw piano audio reaches Gemini cleanly.
- **Real-time scene detection**: We needed the agent's narration to drive visual changes without explicit tool calls. Parsing transcripts for keyword patterns proved simpler and more reliable than complex tool plumbing.
- **Quantifying "improvement"**: Turning subjective musical quality into a number required combining dynamics evenness (coefficient of variation across frequency bands) with rhythm accuracy (onset proximity to beat grid).

## Accomplishments that we're proud of

- **Bidirectional multimodal interaction** — most entries do text-in, multimodal-out. We do multimodal-in, multimodal-out. The agent correlates what it *sees* (finger position) with what it *hears* (note quality) in a single response.
- **Quantifiable improvement** — the technique score goes from ~40 to ~85 during a session. This isn't subjective — it's computed from audio analysis.
- **Dense output interleaving** — 8 output modalities update simultaneously: voice, scenes, visualizations, text, achievements, and navigation. This is what "breaking the text box paradigm" looks like.

## What we learned

1. **Latency is the UI** — in a musical context, even 500ms delay breaks the experience. Streaming raw PCM chunks via ADK's LiveRequestQueue was critical.
2. **Narrative anchors engagement** — the same coaching tip feels robotic as text but engaging as a story beat. "Your E is weak" becomes "The flower hasn't bloomed yet."
3. **Prompting for visuals** — teaching the agent scene vocabulary lets it drive complex frontend animations through natural speech, no separate API needed.

## What's next for PianoQuest Live

- Web MIDI API integration for actual MIDI keyboard input (velocity data for true dynamic analysis)
- Multi-instrument support (guitar, drums)
- Session history with progress tracking across sessions
- Integration with the PianoQuest mobile app for a complete learning ecosystem

## Built With

`gemini-2.5-flash` `google-adk` `cloud-run` `cloud-build` `python` `fastapi` `websocket` `web-audio-api` `canvas` `docker`
