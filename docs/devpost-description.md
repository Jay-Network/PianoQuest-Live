# PianoQuest Live — Devpost Submission

## Inspiration

After a piano lesson, you're on your own. No teacher hears that your E is weaker than your C, or that you're rushing the second beat. Practice apps grade notes right or wrong but never *coach* — and they certainly don't have a conversation with you about it. We asked: what if an AI could listen to your playing, read your MIDI data, and coach you through natural voice conversation in real time?

## What it does

PianoQuest Live is an AI piano coach that makes you a better musician through real-time voice conversation. Connect a MIDI keyboard, play, and talk — Gemini listens to your audio, reads your MIDI data (notes, velocity, timing, pedal), and coaches you like a teacher sitting next to you on the bench.

**Multimodal inputs, processed simultaneously:**
- **Audio** from microphone — piano sound, dynamics, user voice
- **MIDI** from USB keyboard — exact notes, velocity, timing, pedal events
- **Voice** — the user's goals, questions, and reactions

**What you experience:**
- Real-time voice coaching through natural conversation ("That C was a bit heavy — try lighter touch")
- Scrolling grand staff notation showing your playing in real time
- Waterfall display with velocity-colored falling notes
- Dynamic bars showing per-note intensity across the keyboard
- Coaching focus card updated by Gemini through tool calls
- Multi-device support: desktop for MIDI + visualization, tablet for mic input

The key innovation: Gemini processes audio AND structured MIDI data in the same Live API session. It can correlate what it *hears* with precise note/velocity/timing information, enabling coaching that was previously only possible with a human teacher.

## How we built it

- **Gemini 2.5 Flash** (native audio model) via the Live API processes microphone audio and MIDI context simultaneously in real-time streaming
- **Google GenAI SDK** (`@google/genai`) handles the Live API connection with bidirectional audio streaming
- **Google ADK** defines the agent structure with tool functions (`set_coaching_focus`) that Gemini calls to drive visual changes
- **TypeScript + Express + WebSocket** streams 16kHz PCM audio and MIDI events from browser to Gemini, and 24kHz voice audio plus tool events back
- **Web MIDI API** captures real keyboard input (note-on/off, velocity, pedal, timing)
- **Canvas** renders grand staff notation, waterfall display, and dynamics visualization in real time
- **Cloud Run** hosts the containerized application

## Challenges we ran into

- **Audio feedback loops**: Gemini's voice output feeding back into the microphone. Solved with multi-device architecture — separate mic device from speaker device.
- **MIDI-to-notation in real time**: Rendering proper grand staff notation (treble/bass clef, accidentals, key signatures) from live MIDI input required careful music theory implementation — natural signs for non-diatonic white keys, proper sharp/flat handling per key signature.
- **Cloud Run WebSocket timeouts**: Idle spectator connections were being killed. Solved with 25-second keepalive pings.
- **Gemini input transcription bug**: The Live API's `inputAudioTranscription` outputs wrong languages (Arabic, Korean) on native audio models. Solved by using Web Speech API on the client side instead.

## Accomplishments that we're proud of

- **Real-time music notation from MIDI** — proper grand staff with clefs, accidentals, key signatures, scrolling in time with the music
- **Natural voice coaching** — Gemini doesn't lecture; it has a conversation. Short, specific, encouraging.
- **Multi-device architecture** — desktop for MIDI + visualization, tablet for audio capture, phone for spectating. All synced via WebSocket rooms.
- **MIDI + audio fusion** — combining precise digital data with acoustic perception in the same AI context window

## What we learned

1. **Native audio models need workarounds** — input transcription doesn't work reliably on Gemini's native audio models. Web Speech API on the client is more reliable for user speech-to-text.
2. **Latency is the UI** — in a musical context, streaming raw PCM through the Live API is critical. Any buffering breaks the conversational flow.
3. **Let the model drive** — giving Gemini tool functions to update the UI (rather than pattern-matching on transcripts) makes the system robust and the coaching feel natural.

## What's next for PianoQuest Live

- Sheet music loading and comparison (play-along with target notes)
- Session history with progress tracking
- Livestream to web viewers (piano performance broadcasting)
- Multi-instrument support

## Built With

`gemini-2.5-flash` `google-genai-sdk` `google-adk` `cloud-run` `cloud-build` `typescript` `express` `websocket` `web-midi-api` `web-audio-api` `canvas`
