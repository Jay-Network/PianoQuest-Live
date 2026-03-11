# PianoQuest Live

**Competition:** Gemini Live Agent Challenge (deadline March 16, 2026)
**Category:** Creative Storyteller (video + audio + voice + MIDI visualization)
**GCP Project:** jworks-interpreter-challenge
**Cloud Run Service:** pianoquest-live

## Concept

Interactive musical storytelling where the user's piano playing drives an AI narrative.
The agent listens to piano audio, interprets the musical mood, and weaves it into
an evolving story with real-time visual MIDI feedback.

## Architecture

- **Backend:** Python (Google ADK + FastAPI + WebSocket)
- **Frontend:** HTML/JS with Web Audio API + MIDI visualization
- **Deployment:** Google Cloud Run via Cloud Build
- **API:** Gemini Live API (native audio model)

## Development

```bash
pip install -r requirements.txt
python -m agent
```
