#!/usr/bin/env python3
"""Manual WebSocket probe for PianoQuest Live."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from typing import Iterable
from urllib.parse import urlparse

import websockets


EXPECTED_TYPES = [
    "input_transcript",
    "output_transcript",
    "turn_complete",
    "story_scene",
    "achievement",
    "coaching_focus",
    "quest_advance",
]


def normalize_target(target: str) -> str:
    if target.startswith("ws://") or target.startswith("wss://"):
        return target
    if target.startswith("http://") or target.startswith("https://"):
        parsed = urlparse(target)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        path = parsed.path.rstrip("/")
        if path.endswith("/ws/dialog"):
            ws_path = path
        elif not path:
            ws_path = "/ws/dialog"
        else:
            ws_path = f"{path}/ws/dialog"
        return f"{scheme}://{parsed.netloc}{ws_path}"
    return target


async def receive_messages(ws: websockets.ClientConnection, duration: float) -> set[str]:
    seen: set[str] = set()
    deadline = time.monotonic() + duration

    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            break
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
        except asyncio.TimeoutError:
            break

        if isinstance(raw, bytes):
            print(f"[bytes] received {len(raw)} bytes")
            continue

        try:
            msg = json.loads(raw)
        except json.JSONDecodeError as exc:
            print(f"[invalid-json] {exc}: {raw}")
            continue

        if not isinstance(msg, dict):
            print(f"[json] non-object message: {msg!r}")
            continue

        msg_type = str(msg.get("type", "<missing>"))
        seen.add(msg_type)
        print(f"[json] type={msg_type} payload={json.dumps(msg, ensure_ascii=True)}")

    return seen


async def run_probe(target: str, mode: str, prompt: str, duration: float) -> set[str]:
    async with websockets.connect(target, max_size=None) as ws:
        await ws.send(json.dumps({"type": "set_mode", "mode": mode}))
        await ws.send(json.dumps({"type": "text", "content": prompt}))
        print(f"Connected to {target}")
        print(f"Sent set_mode={mode!r}")
        print(f"Sent text prompt={prompt!r}")
        seen = await receive_messages(ws, duration)
        try:
            await ws.send(json.dumps({"type": "close"}))
        except Exception:
            pass
        return seen


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Probe PianoQuest Live WebSocket responses for 15 seconds."
    )
    parser.add_argument(
        "target",
        nargs="?",
        default="ws://localhost:8080/ws/dialog",
        help="WebSocket URL or app base URL. Default: ws://localhost:8080/ws/dialog",
    )
    parser.add_argument(
        "--mode",
        default="storyteller",
        help="Mode sent in the set_mode message. Default: storyteller",
    )
    parser.add_argument(
        "--prompt",
        default="Hello, start a piano coaching session",
        help="Text content sent after set_mode.",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=15.0,
        help="Seconds to listen for messages. Default: 15",
    )
    return parser.parse_args(list(argv))


def print_summary(seen: set[str]) -> None:
    print("\nSummary")
    for msg_type in EXPECTED_TYPES:
        status = "seen" if msg_type in seen else "not seen"
        print(f"- {msg_type}: {status}")

    extras = sorted(seen.difference(EXPECTED_TYPES))
    if extras:
        print(f"- extra_types: {', '.join(extras)}")


def main(argv: Iterable[str]) -> int:
    args = parse_args(argv)
    target = normalize_target(args.target)
    print(f"Target: {target}")
    try:
        seen = asyncio.run(run_probe(target, args.mode, args.prompt, args.duration))
    except Exception as exc:
        print(f"Connection failed: {exc}", file=sys.stderr)
        return 1

    print_summary(seen)
    return 0 if seen else 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
