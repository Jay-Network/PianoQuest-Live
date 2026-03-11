"""
FastAPI + WebSocket server for PianoQuest Live — Creative Musical Storytelling.
Connects browser camera + microphone → ADK streaming → Gemini Live API → audio output.
Tool-driven visual events (scenes, achievements, coaching) are sent via WebSocket JSON.
"""

import asyncio
import base64
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

from .agent import AGENTS, root_agent, visual_queue

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


NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def midi_note_name(note: int) -> str:
    octave = (note // 12) - 1
    return f"{NOTE_NAMES[note % 12]}{octave}"


def describe_midi_snapshot(
    msg: dict,
    camera_enabled: bool,
    both_hands_detected: bool,
    detected_hand_count: int,
) -> str | None:
    recent_notes = msg.get("recent_notes") or []
    active_notes = msg.get("active_notes") or []
    pedal_down = bool(msg.get("pedal_down"))
    bpm = msg.get("bpm")
    score = msg.get("score")

    note_bits = []
    for item in recent_notes[:8]:
        note = item.get("note")
        velocity = item.get("velocity")
        if isinstance(note, int):
            if isinstance(velocity, int):
                note_bits.append(f"{midi_note_name(note)}@{velocity}")
            else:
                note_bits.append(midi_note_name(note))

    active_bits = []
    for item in active_notes[:8]:
        note = item.get("note")
        velocity = item.get("velocity")
        if isinstance(note, int):
            if isinstance(velocity, int):
                active_bits.append(f"{midi_note_name(note)}@{velocity}")
            else:
                active_bits.append(midi_note_name(note))

    has_performance_signal = bool(recent_notes or active_notes or pedal_down)
    if not has_performance_signal:
        return None

    details = []
    if note_bits:
        details.append("recent notes: " + ", ".join(note_bits))
    if active_bits:
        details.append("currently held: " + ", ".join(active_bits))
    details.append("sustain pedal is down" if pedal_down else "sustain pedal is up")
    if bpm:
        details.append(f"target tempo {bpm} BPM")
    if score is not None:
        details.append(f"current technique score {score}")

    if not details:
        return None

    vision_state = (
        "Camera is off; do not claim visual observations."
        if not camera_enabled else
        "Both hands are visible; finger-specific visual coaching is allowed if it matches the MIDI evidence."
        if both_hands_detected else
        f"Both hands are not fully visible (detected hands: {detected_hand_count}); do not claim finger-specific visual observations."
    )

    return (
        "MIDI performance update from the digital piano. "
        + ". ".join(details)
        + ". "
        + vision_state
        + " Use this instead of piano microphone audio for note, timing, and dynamics analysis."
    )


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
                    voice_name="Puck",
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

    # Per-session visual event queue for tool-driven UI updates
    vq = asyncio.Queue()
    camera_enabled = True
    both_hands_detected = False
    detected_hand_count = 0

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
                    elif msg.get("type") == "video_frame":
                        frame_data = base64.b64decode(msg["data"])
                        live_queue.send_realtime(
                            types.Blob(data=frame_data, mime_type="image/jpeg")
                        )
                    elif msg.get("type") == "set_mode":
                        mode = msg.get("mode", "storyteller")
                        if not mode_set:
                            mode_set = True
                            mode_ready.set()
                    elif msg.get("type") == "midi_snapshot":
                        summary = describe_midi_snapshot(
                            msg,
                            camera_enabled=camera_enabled,
                            both_hands_detected=both_hands_detected,
                            detected_hand_count=detected_hand_count,
                        )
                        if summary:
                            live_queue.send_content(
                                types.Content(role="user", parts=[types.Part(text=summary)])
                            )
                    elif msg.get("type") == "midi_event":
                        # Frontend uses raw MIDI events for UI rendering; snapshots are what
                        # get forwarded to the live agent as compact musical context.
                        pass
                    elif msg.get("type") == "camera_state":
                        camera_enabled = bool(msg.get("enabled"))
                        if not camera_enabled:
                            both_hands_detected = False
                            detected_hand_count = 0
                    elif msg.get("type") == "hand_state":
                        detected_hand_count = int(msg.get("detected_count") or 0)
                        both_hands_detected = bool(msg.get("both_hands_detected"))
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

        # Set the contextvars visual queue for this session's tool calls
        token = visual_queue.set(vq)

        try:
            buf_input = ""
            buf_output = ""
            turn_has_user_speech = False
            pending_audio_chunks: list[bytes] = []
            async for event in start_agent_session(session_id, live_queue, mode):
                # Drain visual event queue — send tool-driven UI updates
                while not vq.empty():
                    try:
                        visual_event = vq.get_nowait()
                        await websocket.send_text(json.dumps(visual_event))
                    except asyncio.QueueEmpty:
                        break

                if event.input_transcription:
                    raw = event.input_transcription
                    text = getattr(raw, 'text', None) or str(raw)
                    text = text.strip()
                    if text:
                        buf_input = text
                        turn_has_user_speech = True
                        while pending_audio_chunks:
                            await websocket.send_bytes(pending_audio_chunks.pop(0))
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.inline_data and part.inline_data.data:
                            if turn_has_user_speech:
                                await websocket.send_bytes(part.inline_data.data)
                            else:
                                pending_audio_chunks.append(part.inline_data.data)
                if event.output_transcription:
                    raw = event.output_transcription
                    text = getattr(raw, 'text', None) or str(raw)
                    text = text.strip()
                    if text:
                        buf_output = text
                if event.turn_complete:
                    if turn_has_user_speech and buf_input:
                        await websocket.send_text(json.dumps({"type": "input_transcript", "text": buf_input}))
                        buf_input = ""
                    if turn_has_user_speech and buf_output:
                        await websocket.send_text(json.dumps({"type": "output_transcript", "text": buf_output}))
                        buf_output = ""
                    pending_audio_chunks.clear()
                    if turn_has_user_speech:
                        await websocket.send_text(json.dumps({"type": "turn_complete"}))
                    turn_has_user_speech = False
                if event.interrupted:
                    if turn_has_user_speech and buf_input:
                        await websocket.send_text(json.dumps({"type": "input_transcript", "text": buf_input}))
                        buf_input = ""
                    if turn_has_user_speech and buf_output:
                        await websocket.send_text(json.dumps({"type": "output_transcript", "text": buf_output}))
                        buf_output = ""
                    pending_audio_chunks.clear()
                    if turn_has_user_speech:
                        await websocket.send_text(json.dumps({"type": "interrupted"}))
                    turn_has_user_speech = False
        except WebSocketDisconnect:
            pass
        finally:
            visual_queue.reset(token)

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
