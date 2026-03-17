```
+------------------------------------------------------------------+
|                        PIANOQUEST LIVE                            |
|                  Real-Time Multimodal Piano Coach                 |
+------------------------------------------------------------------+

                    THREE SIMULTANEOUS INPUT STREAMS
                    ================================

  +------------------+    +------------------+    +------------------+
  |   DESKTOP PC     |    |   PHONE/TABLET   |    |  USB MIDI PIANO  |
  |   (Primary)      |    |   (Secondary)    |    |  (CASIO etc.)    |
  |                  |    |                  |    |                  |
  | - Browser UI     |    | - Camera JPEG    |    | - Note events    |
  | - Web Audio API  |    | - MediaPipe      |    | - Velocity 0-127 |
  | - Web MIDI API   |    |   HandLandmarker |    | - Timestamps     |
  | - Mic (PCM 16k)  |    | - Mic (optional) |    | - Pedal state    |
  +--------+---------+    +--------+---------+    +--------+---------+
           |                       |                       |
           | WebSocket             | WebSocket             | Web MIDI API
           | /ws/session           | /ws/session?room=CODE |
           |                       |                       |
           v                       v                       v
+------------------------------------------------------------------+
|                                                                    |
|              GOOGLE CLOUD RUN (TypeScript/Express)                |
|                                                                    |
|  +------------------------------------------------------------+  |
|  |                   WebSocket Server                          |  |
|  |                                                              |  |
|  |  /ws/session (primary)     - Creates Gemini Live session    |  |
|  |                             - Creates room + room code      |  |
|  |                             - Forwards audio to Gemini      |  |
|  |                             - Sends MIDI text to Gemini     |  |
|  |                                                              |  |
|  |  /ws/session?room=CODE     - Joins existing room            |  |
|  |  (secondary)                - Forwards camera to Gemini     |  |
|  |                             - Forwards mic audio            |  |
|  |                             - Role management (mic/camera)  |  |
|  |                                                              |  |
|  |  /ws/spectator             - Read-only broadcast viewer     |  |
|  |  /ws/midi                  - External MIDI bridge input     |  |
|  +------------------------------------------------------------+  |
|                          |                                        |
|                          | @google/genai SDK                      |
|                          | live.connect()                         |
|                          v                                        |
|  +------------------------------------------------------------+  |
|  |                                                              |  |
|  |              GEMINI LIVE API SESSION                         |  |
|  |              (gemini-2.5-flash-native-audio-preview)        |  |
|  |                                                              |  |
|  |  INPUTS:                                                     |  |
|  |  - sendRealtimeInput({audio})  <-- PCM mic audio (16kHz)    |  |
|  |  - sendRealtimeInput({media})  <-- JPEG camera frames (1fps)|  |
|  |  - sendClientContent({text})   <-- MIDI snapshot text       |  |
|  |                                                              |  |
|  |  OUTPUTS:                                                    |  |
|  |  - Audio response chunks (24kHz PCM)                        |  |
|  |  - Output transcription text                                |  |
|  |  - Tool calls: set_coaching_focus, report_technique         |  |
|  |  - Turn complete / interrupted signals                      |  |
|  |                                                              |  |
|  |  TOOLS (Google ADK):                                         |  |
|  |  - set_coaching_focus: Update coaching tip card              |  |
|  |  - report_technique: Correlate visual + audio observation   |  |
|  |                                                              |  |
|  +------------------------------------------------------------+  |
|                                                                    |
+------------------------------------------------------------------+

                    OUTPUT BACK TO ALL DEVICES
                    ==========================

  +------------------+    +------------------+    +------------------+
  |   DESKTOP UI     |    |   PHONE/TABLET   |    |   SPECTATORS     |
  |                  |    |                  |    |                  |
  | - Gemini voice   |    | - Gemini voice   |    | - Audio playback |
  |   playback       |    |   playback       |    | - MIDI viz       |
  | - Waterfall      |    | - Camera preview |    | - Transcripts    |
  |   piano roll     |    | - Hand skeleton  |    |                  |
  | - Keyboard viz   |    |                  |    |                  |
  | - Conversation   |    |                  |    |                  |
  |   transcripts    |    |                  |    |                  |
  | - Coaching focus  |    |                  |    |                  |
  | - Technique       |    |                  |    |                  |
  |   reports        |    |                  |    |                  |
  | - Drill system   |    |                  |    |                  |
  | - Audio levels   |    |                  |    |                  |
  +------------------+    +------------------+    +------------------+

                    TECHNOLOGY STACK
                    ================

  Google Cloud:  Cloud Run (serverless, WebSocket session affinity)
  AI Model:      Gemini 2.5 Flash Native Audio (real-time streaming)
  SDK:           @google/genai (Live API) + @google/adk (agent tools)
  Backend:       TypeScript, Express, ws (WebSocket)
  Frontend:      HTML/JS, Web Audio API, Web MIDI API, Canvas
  Vision:        MediaPipe HandLandmarker (on-device, phone)
  Build:         Cloud Build (Docker → Container Registry → Cloud Run)
```
