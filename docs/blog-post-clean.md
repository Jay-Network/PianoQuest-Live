# Building a Real-Time AI Piano Coach with Gemini Live API

*Created for the Gemini Live Agent Challenge hackathon*

#GeminiLiveAgentChallenge

---

## The Problem: Piano Practice is Lonely

Music practice has always been a solitary endeavor. You sit alone with your instrument, a metronome, and maybe a YouTube tutorial. Even modern piano apps feel like rhythm games -- they grade you on note accuracy but can't see your hands, can't hear your tone quality, and certainly can't have a conversation about your playing.

When Google announced the **Gemini Live Agent Challenge**, I saw the chance to build something different: an AI that doesn't just listen to notes, but truly *coaches* -- seeing your hands, hearing your music, reading your MIDI data, and talking to you naturally in real time.

---

## What is PianoQuest Live?

**PianoQuest Live** is a real-time multimodal AI piano coach powered by the Gemini 2.5 Flash Native Audio model. It processes three simultaneous input streams:

1. **Voice and Audio (Microphone):** Talk to Gemini naturally -- ask questions about technique, request feedback, or just have a conversation about music theory.
2. **Vision (Camera):** A phone or tablet camera watches your hands at the piano. Gemini sees finger position, wrist angle, and hand form in real time.
3. **MIDI Data (USB Piano):** Every note you play is captured with precise velocity (0-127) and timing data via the Web MIDI API, giving Gemini quantitative evidence to ground its coaching.

The magic is that Gemini processes all three streams simultaneously in a single Live API session, allowing it to correlate what it **sees** (a tense wrist) with what the MIDI **shows** (velocity dropping on those notes) and what it **hears** (a loss of tonal clarity).

---

## The Multi-Device Architecture

One of the biggest technical challenges was that a piano player needs their hands free. You can't hold a phone and play piano at the same time. Our solution: a **multi-device room system**.

```
Desktop PC (primary)          Phone/Tablet (secondary)
|- Browser UI                 |- Camera -> JPEG 1fps
|- Web MIDI API               |- MediaPipe HandLandmarker
|- Mic (PCM 16kHz)            |- Mic (optional)
|- All visualizations
         |                              |
         |---- WebSocket Room ----------|
                      |
              Google Cloud Run
              (TypeScript/Express)
                      |
              Gemini Live API
              (native audio model)
```

1. Open PianoQuest Live on your **desktop** -- it connects to Gemini and displays a room code + QR code.
2. Scan the QR with your **phone** -- it joins the same room and starts streaming camera + hand tracking.
3. Play your **USB MIDI piano** -- the desktop captures every note via Web MIDI API.
4. **Talk naturally** -- Gemini responds with voice, coaching tips, and technique observations.

All devices share a single Gemini Live session. The server merges audio, video, and MIDI into one coherent stream that Gemini processes holistically.

---

## Tech Stack: Gemini + ADK + Cloud Run

- **AI Model:** `gemini-2.5-flash-native-audio-preview` -- the native audio model enables true real-time voice conversation with sub-second latency
- **SDK:** `@google/genai` for the Live API connection (`live.connect()`) + `@google/adk` for structured agent tools
- **Backend:** TypeScript, Express, and `ws` (WebSocket) -- handling multi-device rooms, audio routing, and Gemini session management
- **Frontend:** Vanilla HTML/JS with Web Audio API (PCM capture/playback), Web MIDI API (piano input), and Canvas (piano roll visualization)
- **Hand Tracking:** MediaPipe HandLandmarker running on-device on the phone -- 21 hand landmarks at 30fps, rendered as a skeleton overlay
- **Deployment:** Google Cloud Run via Cloud Build, with Docker containerization and WebSocket session affinity

### Agent Tools (Google ADK)

We defined two structured tools that Gemini can call during conversation:

- **`set_coaching_focus`**: Updates a visible "coaching tip" card on the UI with an actionable suggestion (e.g., "Curve your 4th finger more on the G")
- **`report_technique`**: Reports a correlated observation combining what the AI sees (EYE) with what the MIDI shows (EAR) -- bridging visual and digital feedback

---

## The Hardest Problems We Solved

### 1. Echo Suppression Without Hardware

When Gemini speaks through the laptop speaker, the microphone picks it up and sends it back -- creating an infinite echo loop. We implemented a multi-layer gate:

- **isBotSpeaking gate:** Completely mutes mic transmission while Gemini audio is playing
- **turn_complete signal:** Only resets the gate when Gemini signals it's done speaking (not on individual audio chunk boundaries)
- **Speech recognition grace period:** 1.5-second buffer after Gemini finishes before processing speech recognition results
- **Browser echoCancellation:** Hardware-level AEC as a final safety net

### 2. MIDI Context Without Triggering Responses

Gemini needs continuous MIDI data to give informed feedback, but sending data shouldn't make Gemini start talking unprompted. We solved this using the Live API's `turnComplete` flag:

```typescript
// Background context -- Gemini absorbs but doesn't respond
session.sendClientContent({
  turns: [{ role: "user", parts: [{ text: midiSummary }] }],
  turnComplete: false  // key: no response triggered
});
```

When the user actually asks "how was my playing?", Gemini already has the MIDI context and can give quantitative feedback like "Your tempo drifted +12% in bars 4-6" without having been babbling the whole time.

### 3. Real-Time Audio Streaming

The Gemini Live API expects 16kHz PCM audio. We capture from the browser's `getUserMedia`, downsample in a ScriptProcessor, and stream raw PCM chunks over WebSocket at around 100ms intervals. Gemini's responses come back as 24kHz PCM chunks that we decode and queue for gapless playback. The entire round-trip feels conversational -- like talking to someone in the room.

---

## What I Learned

1. **The Live API is genuinely magical.** Being able to `sendRealtimeInput` with both audio and JPEG frames, and have Gemini reason about them together in real time, feels like the future of AI interaction.

2. **Multi-device is hard but worth it.** Managing WebSocket rooms, role assignment, and synchronized audio across devices added significant complexity, but the result -- hands-free piano coaching -- is only possible with this architecture.

3. **Native audio changes everything.** Previous approaches required speech-to-text then LLM then text-to-speech pipelines with cumulative latency. Gemini's native audio model handles the full loop in one step, making real-time conversation actually feel real-time.

4. **MIDI + Vision + Audio is the trifecta.** Any one input alone gives incomplete information. MIDI gives precise timing and velocity. Vision shows hand form and technique. Audio captures tonal quality. Together, they enable coaching that rivals a human teacher sitting next to you.

---

## What's Next

- **Drill System:** Structured exercises with specific targets (tempo, dynamics) that Gemini monitors and scores
- **On-Demand Recording:** Capture a passage, then get deep multimodal analysis correlating hand form with MIDI data
- **Sheet Music Practice:** Notes flow toward you in a waterfall display -- play along while Gemini silently observes, then delivers a comprehensive end-of-piece analysis
- **Historical Tracking:** Compare sessions over time to identify persistent habits and measure improvement

---

## Try It

- **Live Demo:** [https://pianoquest-live-604879855725.us-central1.run.app](https://pianoquest-live-604879855725.us-central1.run.app)
- **GitHub:** [https://github.com/Jay-Network/PianoQuest-Live](https://github.com/Jay-Network/PianoQuest-Live)

PianoQuest Live is built for the Gemini Live Agent Challenge hackathon. It uses Google Cloud Run, the Gemini 2.5 Flash Native Audio model, the Google GenAI SDK, and the Google Agent Development Kit (ADK).

#GeminiLiveAgentChallenge #GoogleAI #GeminiAPI #ADK #CloudRun
