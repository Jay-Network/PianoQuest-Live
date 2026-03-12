# PianoQuest Live — Devpost Submission

## Inspiration

After a piano lesson, you're on your own. No teacher watches your hands. No one hears that your E is weaker than your C. Practice apps grade notes right or wrong but never see *how* you play — and they certainly don't make it meaningful. We asked: what if an AI could see your hands, hear your music, and coach you to actually play better?

## What it does

PianoQuest Live is an AI piano coach that makes you a better musician. Point your camera at the keyboard, play, and talk — Gemini watches your technique, listens to your sound, and coaches you through creative narrative in real time. The result is measurable: users improve from a technique score of ~40 to ~85 in a single session.

**3 multimodal inputs, processed simultaneously:**
- **Camera** sees finger position, hand shape, and technique
- **Microphone** hears piano notes, dynamics, rhythm, and articulation
- **Voice** captures the user's goals, questions, and reactions

**What you experience:**
- Real-time voice coaching wrapped in storytelling ("Welcome to the Harmony Garden — every note must bloom equally")
- Visual scene transitions that Gemini triggers through tool calls when the narrative shifts
- Achievement badges awarded by Gemini when it detects genuine improvement
- MIDI dynamic bars and rhythm accuracy grid computed from live audio analysis
- A technique score that quantifies your progress in real time

The key innovation: Gemini doesn't just respond to your playing — it **correlates what it sees with what it hears**. "I can see your middle finger is flatter than the others, and I can hear the E getting lost." This integrated visual-audio feedback was previously impossible without expensive specialized equipment.

## How we built it

- **Gemini 2.5 Flash** (native audio + vision) via the Live API processes camera frames and microphone audio simultaneously in a single context window — no separate transcription or MIDI conversion needed
- **Google ADK** (Agent Development Kit) handles the streaming runtime. The agent has 4 custom tool functions (`set_scene`, `award_badge`, `set_coaching_focus`, `advance_quest`) that Gemini calls to drive visual changes on the user's screen
- **FastAPI + WebSocket** streams 16kHz PCM audio and JPEG frames from browser to ADK, and 24kHz voice audio plus tool-driven visual events back
- **Web Audio API** performs client-side frequency analysis for the MIDI dynamic bars and onset detection for the rhythm grid
- **Cloud Run** hosts the containerized application

The agent prompt combines music pedagogy with creative storytelling. Gemini decides when to shift scenes, award achievements, and update coaching tips by calling its tools — the model controls the full multimodal experience, not frontend keyword matching.

## Challenges we ran into

- **Audio feedback loops**: The agent's voice output would feed back into the microphone. Solved by disabling echo cancellation so raw piano audio reaches Gemini cleanly.
- **Tool-driven visual control**: We initially used frontend keyword matching on transcripts to trigger scenes and badges. This felt dishonest — the "multimodal output" was really just string parsing. We rewrote the architecture so Gemini calls ADK tool functions that push events through a per-session queue to the frontend via WebSocket. Now the model genuinely decides when visuals change.
- **Quantifying improvement**: Turning subjective musical quality into a number required combining dynamics evenness (coefficient of variation across frequency bands) with rhythm accuracy (onset proximity to beat grid).

## Accomplishments that we're proud of

- **AI that develops a real creative skill** — after using PianoQuest, you play piano better. The technique score proves it: ~40 to ~85. AI amplifies human creativity rather than replacing it.
- **Bidirectional multimodal interaction** — most entries do text-in, multimodal-out. We do multimodal-in (vision + audio + voice), multimodal-out (voice + tool-driven visuals + real-time data). The agent correlates what it *sees* with what it *hears* in a single response.
- **Agent-driven UI** — Gemini controls the visual experience through ADK tool calls, not scripted frontend triggers. The model decides when to change scenes, award achievements, and update coaching tips.

## What we learned

1. **Latency is the UI** — in a musical context, even 500ms delay breaks the experience. Streaming raw PCM via ADK's LiveRequestQueue was critical.
2. **Narrative anchors engagement** — the same coaching tip feels robotic as text but engaging as a story beat. "Your E is weak" becomes "The flower hasn't bloomed yet."
3. **Let the model drive** — our first approach (frontend keyword matching) was fragile and dishonest. Giving Gemini tool functions to control the UI made the system more robust and genuinely multimodal.

## What's next for PianoQuest Live

- Web MIDI API integration for actual MIDI keyboard input (velocity data for true dynamic analysis)
- Multi-instrument support (guitar, drums)
- Session history with progress tracking across sessions
- Integration with the PianoQuest mobile app for a complete learning ecosystem

## Built With

`gemini-2.5-flash` `google-adk` `cloud-run` `cloud-build` `python` `fastapi` `websocket` `web-audio-api` `canvas` `docker`
