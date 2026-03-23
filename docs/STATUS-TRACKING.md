# PianoQuest Live — Backend Status Tracking

Added in v3.3.3. Proactive health monitoring for all inter-app connections and system state.

## Endpoints

### `GET /health` (lightweight)

Quick health check with key booleans:

```json
{
  "status": "ok",
  "service": "pianoquest",
  "modes": ["storyteller"],
  "spectators": 1,
  "rooms": 1,
  "desktopBridge": true,
  "gemini": false
}
```

### `GET /status` (detailed)

Full system status with timestamps and counters:

```json
{
  "desktopBridge": {
    "connected": true,
    "url": "ws://127.0.0.1:3490/ws",
    "connectedAt": 1711152000000,
    "disconnectedAt": null,
    "lastMidiEvent": 1711152060000,
    "midiEventCount": 342,
    "reconnectAttempts": 0
  },
  "room": {
    "code": "HOME",
    "live": true,
    "deviceCount": 1,
    "primaryConnected": true,
    "primaryConnectedAt": 1711152000000
  },
  "gemini": {
    "connected": false,
    "connectedAt": null,
    "sessionId": null,
    "audioChunksSent": 0
  },
  "coaching": {
    "active": false,
    "startedAt": null
  },
  "spectators": {
    "count": 1
  },
  "uptime": 3600
}
```

## Field Reference

| Field | Meaning |
|---|---|
| `desktopBridge.connected` | Whether PQ Live is connected to PQ Desktop :3490/ws |
| `desktopBridge.lastMidiEvent` | Timestamp of last MIDI event received from bridge |
| `desktopBridge.midiEventCount` | Total MIDI events received since server start |
| `desktopBridge.reconnectAttempts` | Number of reconnect attempts since last successful connection |
| `room.live` | Whether the HOME room is streaming to spectators |
| `room.primaryConnected` | Whether a browser primary device is connected |
| `room.deviceCount` | Number of devices (browser, phone, tablet) in the room |
| `gemini.connected` | Whether Gemini Live API session is active |
| `gemini.audioChunksSent` | Audio chunks sent from Gemini to clients |
| `coaching.active` | Whether Start Coaching has been activated |
| `spectators.count` | Number of connected spectators (iPad, /live page) |
| `uptime` | Seconds since server start |

## Periodic Console Log

Every 60 seconds, the server logs a one-line status summary:

```
[pianoquest] STATUS | bridge:UP midi:5s ago(342) | gemini:OFF coaching:OFF | primary:YES devices:1 spectators:1 | stream:LIVE | uptime:3600s
```

Fields:
- `bridge:UP/DOWN` — desktop bridge connection
- `midi:Ns ago(count)` — last MIDI event age and total count
- `gemini:UP/OFF` — Gemini Live session
- `coaching:ON/OFF` — coaching mode
- `primary:YES/NO` — browser primary connected
- `devices:N` — total devices in room
- `spectators:N` — connected spectators
- `stream:LIVE/OFF` — whether room is streaming
- `uptime:Ns` — server uptime in seconds

## Usage

### Quick check from terminal
```bash
curl -s http://localhost:8090/status | jq .
```

### Check bridge health
```bash
curl -s http://localhost:8090/status | jq '.desktopBridge'
```

### Monitor from agent
```bash
# Watch status every 10s
watch -n 10 'curl -s http://localhost:8090/status | jq .'
```
