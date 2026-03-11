"""
FastAPI + WebSocket server for PianoQuest Live — Creative Musical Storytelling.
Connects browser microphone → ADK streaming → Gemini Live API → audio output.
"""

import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.adk.runners import Runner, RunConfig
from google.adk.sessions import InMemorySessionService
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.genai import types

from .agent import AGENTS, root_agent

load_dotenv()

APP_NAME = "pianoquest"
STATIC_DIR = Path(__file__).parent.parent / "static"
session_service = InMemorySessionService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[{APP_NAME}] Starting up...")
    yield
    print(f"[{APP_NAME}] Shutting down...")


app = FastAPI(title="PianoQuest Live", lifespan=lifespan)


async def start_agent_session(session_id: str, live_queue: LiveRequestQueue, mode: str = "storyteller"):
    agent = AGENTS.get(mode, root_agent)

    runner = Runner(
        app_name=APP_NAME,
        agent=agent,
        session_service=session_service,
    )

    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=f"user-{session_id}",
    )

    run_config = RunConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Aoede",
                )
            )
        ),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        realtime_input_config=types.RealtimeInputConfig(
            automaticActivityDetection=types.AutomaticActivityDetection(
                silenceDurationMs=1000,
            )
        ),
    )

    async for event in runner.run_live(
        session=session,
        live_request_queue=live_queue,
        run_config=run_config,
    ):
        yield event


@app.websocket("/ws/dialog")
async def websocket_dialog(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())[:8]
    live_queue = LiveRequestQueue()
    mode = "storyteller"
    mode_ready = asyncio.Event()

    print(f"[{APP_NAME}] Client connected: {session_id}")

    async def handle_input():
        nonlocal mode
        mode_set = False
        try:
            while True:
                data = await websocket.receive()
                if "bytes" in data:
                    live_queue.send_realtime(
                        types.Blob(data=data["bytes"], mime_type="audio/pcm;rate=16000")
                    )
                elif "text" in data:
                    msg = json.loads(data["text"])
                    if msg.get("type") == "text":
                        live_queue.send_content(
                            types.Content(role="user", parts=[types.Part(text=msg["content"])])
                        )
                    elif msg.get("type") == "set_mode":
                        mode = msg.get("mode", "storyteller")
                        if not mode_set:
                            mode_set = True
                            mode_ready.set()
                    elif msg.get("type") == "close":
                        live_queue.close()
                        break
        except WebSocketDisconnect:
            live_queue.close()

    async def handle_output():
        try:
            await asyncio.wait_for(mode_ready.wait(), timeout=5.0)
        except asyncio.TimeoutError:
            pass
        try:
            buf_input = ""
            buf_output = ""
            async for event in start_agent_session(session_id, live_queue, mode):
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.inline_data and part.inline_data.data:
                            await websocket.send_bytes(part.inline_data.data)
                if event.input_transcription:
                    raw = event.input_transcription
                    text = getattr(raw, 'text', None) or str(raw)
                    text = text.strip()
                    if text:
                        buf_input = text
                if event.output_transcription:
                    raw = event.output_transcription
                    text = getattr(raw, 'text', None) or str(raw)
                    text = text.strip()
                    if text:
                        buf_output = text
                if event.turn_complete:
                    if buf_input:
                        await websocket.send_text(json.dumps({"type": "input_transcript", "text": buf_input}))
                        buf_input = ""
                    if buf_output:
                        await websocket.send_text(json.dumps({"type": "output_transcript", "text": buf_output}))
                        buf_output = ""
                    await websocket.send_text(json.dumps({"type": "turn_complete"}))
                if event.interrupted:
                    if buf_input:
                        await websocket.send_text(json.dumps({"type": "input_transcript", "text": buf_input}))
                        buf_input = ""
                    if buf_output:
                        await websocket.send_text(json.dumps({"type": "output_transcript", "text": buf_output}))
                        buf_output = ""
                    await websocket.send_text(json.dumps({"type": "interrupted"}))
        except WebSocketDisconnect:
            pass

    input_task = asyncio.create_task(handle_input())
    output_task = asyncio.create_task(handle_output())
    try:
        await asyncio.gather(input_task, output_task)
    except Exception as e:
        print(f"[{APP_NAME}] Session {session_id} error: {e}")
    finally:
        print(f"[{APP_NAME}] Client disconnected: {session_id}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": APP_NAME, "modes": list(AGENTS.keys())}


@app.get("/")
async def root():
    return HTMLResponse(content=(STATIC_DIR / "index.html").read_text())


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
