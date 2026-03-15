/**
 * PianoQuest Live — Express + WebSocket server with Gemini Live API.
 *
 * Uses @google/genai SDK live.connect() for Gemini Live sessions.
 */

import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { GoogleGenAI, Modality, type Session } from "@google/genai";
import {
  LIVE_MODEL,
  STORYTELLER_INSTRUCTION,
  buildToolDeclarations,
  executeToolLocally,
  toolCallToVisualEvent,
} from "./agent.js";

const APP_NAME = "pianoquest";
const STATIC_DIR = path.join(__dirname, "..", "..", "static");
const SHEETS_DIR = path.join(__dirname, "..", "..", "sheets");

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiNoteName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  return `${NOTE_NAMES[note % 12]}${octave}`;
}

function describeMidiSnapshot(
  msg: Record<string, unknown>,
  cameraEnabled: boolean,
  bothHandsDetected: boolean,
  detectedHandCount: number
): string | null {
  const recentNotes = (msg.recent_notes as Array<Record<string, unknown>>) ?? [];
  const activeNotes = (msg.active_notes as Array<Record<string, unknown>>) ?? [];
  const detectedTechniques = (msg.detected_techniques as unknown[]) ?? [];
  const pedalDown = Boolean(msg.pedal_down);
  const bpm = msg.bpm as number | undefined;
  const score = msg.score as number | undefined;

  const noteBits: string[] = [];
  for (const item of recentNotes.slice(0, 8)) {
    const note = item.note as number | undefined;
    const velocity = item.velocity as number | undefined;
    if (typeof note === "number") {
      noteBits.push(
        typeof velocity === "number"
          ? `${midiNoteName(note)}@${velocity}`
          : midiNoteName(note)
      );
    }
  }

  const activeBits: string[] = [];
  for (const item of activeNotes.slice(0, 8)) {
    const note = item.note as number | undefined;
    const velocity = item.velocity as number | undefined;
    if (typeof note === "number") {
      activeBits.push(
        typeof velocity === "number"
          ? `${midiNoteName(note)}@${velocity}`
          : midiNoteName(note)
      );
    }
  }

  const hasPerformanceSignal = recentNotes.length > 0 || activeNotes.length > 0 || pedalDown;
  if (!hasPerformanceSignal) return null;

  const details: string[] = [];
  if (noteBits.length > 0) details.push("recent notes: " + noteBits.join(", "));
  if (activeBits.length > 0) details.push("currently held: " + activeBits.join(", "));
  details.push(pedalDown ? "sustain pedal is down" : "sustain pedal is up");
  if (bpm) details.push(`target tempo ${bpm} BPM`);
  if (score !== undefined) details.push(`current technique score ${score}`);
  if (detectedTechniques.length > 0) {
    details.push(
      "detected techniques: " + detectedTechniques.slice(0, 6).map(String).join(", ")
    );
  }

  if (details.length === 0) return null;

  const visionState = !cameraEnabled
    ? "Camera is off; do not claim visual observations."
    : bothHandsDetected
      ? "Both hands are visible; finger-specific visual coaching is allowed if it matches the MIDI evidence."
      : `Both hands are not fully visible (detected hands: ${detectedHandCount}); do not claim finger-specific visual observations.`;

  return (
    "MIDI performance update from the digital piano. " +
    details.join(". ") +
    ". " +
    visionState +
    " Use this instead of piano microphone audio for note, timing, and dynamics analysis."
  );
}

// =========================================================================
// Spectator broadcasting — spectators receive all output but send nothing
// =========================================================================

const spectators = new Set<WebSocket>();

function broadcastSpectators(data: Buffer | string, binary = false) {
  for (const s of spectators) {
    if (s.readyState === WebSocket.OPEN) {
      try { s.send(data, { binary }); } catch {}
    }
  }
}

// =========================================================================
// Device management types
// =========================================================================

interface DeviceRoles {
  mic: boolean;
  camera: boolean;
  midi: boolean;
}

interface Device {
  id: string;
  ws: WebSocket;
  name: string;
  deviceType: "desktop" | "tablet" | "phone" | "unknown";
  isPrimary: boolean;
  roles: DeviceRoles;
  connectedAt: number;
}

interface RoomSession {
  sendRealtimeInput: (input: any) => void;
  sendClientContent: (content: any) => void;
  primaryWs: WebSocket;
  /** All devices in this room */
  devices: Map<string, Device>;
  /** Accumulated MIDI notes for periodic Gemini snapshots */
  midiBuffer: Array<{ note: number; velocity: number; event: string; timestampMs: number }>;
  midiFlushTimer: ReturnType<typeof setTimeout> | null;
  cameraEnabled: boolean;
  bothHandsDetected: boolean;
  detectedHandCount: number;
}

const rooms = new Map<string, RoomSession>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const arr = new Uint8Array(4);
  require("crypto").randomFillSync(arr);
  for (let i = 0; i < 4; i++) {
    code += chars[arr[i] % chars.length];
  }
  return code;
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  require("crypto").randomFillSync(arr);
  return Buffer.from(arr).toString("hex");
}

// =========================================================================
// Device detection from User-Agent
// =========================================================================

function detectDeviceType(req: IncomingMessage): "desktop" | "tablet" | "phone" | "unknown" {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile"))) return "tablet";
  if (ua.includes("iphone") || ua.includes("android")) return "phone";
  if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) return "desktop";
  return "unknown";
}

function deviceTypeIcon(type: string): string {
  switch (type) {
    case "desktop": return "💻";
    case "tablet": return "📱";
    case "phone": return "📷";
    default: return "🔲";
  }
}

function deviceTypeName(type: string): string {
  switch (type) {
    case "desktop": return "Desktop";
    case "tablet": return "Tablet";
    case "phone": return "Phone";
    default: return "Device";
  }
}

// =========================================================================
// Room broadcasting — send to all devices in a room + spectators
// =========================================================================

function broadcastToRoom(room: RoomSession, data: Buffer | string, binary = false) {
  for (const device of room.devices.values()) {
    if (device.ws.readyState === WebSocket.OPEN) {
      try { device.ws.send(data, { binary }); } catch {}
    }
  }
  broadcastSpectators(data, binary);
}

function sendDeviceList(room: RoomSession) {
  const list = Array.from(room.devices.values()).map((d) => ({
    id: d.id,
    name: d.name,
    deviceType: d.deviceType,
    isPrimary: d.isPrimary,
    roles: { ...d.roles },
    connectedAt: d.connectedAt,
  }));
  const msg = JSON.stringify({ type: "device_list", devices: list });
  // Send to all devices so everyone can see the roster
  for (const device of room.devices.values()) {
    if (device.ws.readyState === WebSocket.OPEN) {
      try { device.ws.send(msg); } catch {}
    }
  }
}

function setDeviceRole(
  room: RoomSession,
  deviceId: string,
  role: keyof DeviceRoles,
  enabled: boolean
) {
  const device = room.devices.get(deviceId);
  if (!device) return;

  if (enabled) {
    // Exclusive: disable this role on all other devices
    for (const d of room.devices.values()) {
      if (d.id !== deviceId && d.roles[role]) {
        d.roles[role] = false;
        // Notify the device that lost the role
        if (d.ws.readyState === WebSocket.OPEN) {
          try {
            d.ws.send(JSON.stringify({
              type: "role_assigned",
              roles: { ...d.roles },
            }));
          } catch {}
        }
      }
    }
  }

  device.roles[role] = enabled;

  // Notify the device that got/lost the role
  if (device.ws.readyState === WebSocket.OPEN) {
    try {
      device.ws.send(JSON.stringify({
        type: "role_assigned",
        roles: { ...device.roles },
      }));
    } catch {}
  }

  // Update room-level camera state based on which device has camera
  let anyCameraOn = false;
  for (const d of room.devices.values()) {
    if (d.roles.camera) { anyCameraOn = true; break; }
  }
  room.cameraEnabled = anyCameraOn;

  // Broadcast updated device list
  sendDeviceList(room);
}

// =========================================================================
// Express + WebSocket server
// =========================================================================

export function createApp() {
  const app = express();
  const server = createServer(app);
  const wssDialog = new WebSocketServer({ noServer: true });
  const wssSpectator = new WebSocketServer({ noServer: true });
  const wssCamera = new WebSocketServer({ noServer: true });
  const wssMidi = new WebSocketServer({ noServer: true });
  const wssSession = new WebSocketServer({ noServer: true });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: APP_NAME,
      modes: ["storyteller"],
      spectators: spectators.size,
      rooms: rooms.size,
    });
  });

  app.get("/", (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, "index.html"));
  });

  app.use("/static", express.static(STATIC_DIR));
  app.use("/sheets", express.static(SHEETS_DIR));

  // List sheet music files as a tree
  app.get("/api/sheets", (_req, res) => {
    function walkDir(dir: string, prefix: string): any[] {
      const entries: any[] = [];
      if (!fs.existsSync(dir)) return entries;
      for (const name of fs.readdirSync(dir).sort()) {
        const full = path.join(dir, name);
        const rel = prefix ? `${prefix}/${name}` : name;
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          entries.push({ name, path: rel, type: "folder", children: walkDir(full, rel) });
        } else if (name.endsWith(".json")) {
          entries.push({ name: name.replace(".json", ""), path: rel, type: "file" });
        }
      }
      return entries;
    }
    res.json(walkDir(SHEETS_DIR, ""));
  });

  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    if (url.pathname === "/ws/session") {
      wssSession.handleUpgrade(request, socket, head, (ws) => {
        (ws as any)._req = request;
        (ws as any)._room = url.searchParams.get("room") ?? "";
        (ws as any)._roleHint = url.searchParams.get("role") ?? "";
        wssSession.emit("connection", ws, request);
      });
    } else if (url.pathname === "/ws/dialog") {
      wssDialog.handleUpgrade(request, socket, head, (ws) => {
        wssDialog.emit("connection", ws, request);
      });
    } else if (url.pathname === "/ws/spectator") {
      wssSpectator.handleUpgrade(request, socket, head, (ws) => {
        wssSpectator.emit("connection", ws, request);
      });
    } else if (url.pathname === "/ws/camera") {
      const room = url.searchParams.get("room") ?? "";
      wssCamera.handleUpgrade(request, socket, head, (ws) => {
        (ws as any)._room = room;
        wssCamera.emit("connection", ws, request);
      });
    } else if (url.pathname === "/ws/midi") {
      const room = url.searchParams.get("room") ?? "";
      wssMidi.handleUpgrade(request, socket, head, (ws) => {
        (ws as any)._room = room;
        wssMidi.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // -----------------------------------------------------------------
  // /ws/session — Unified device management endpoint
  // -----------------------------------------------------------------

  wssSession.on("connection", (ws: WebSocket) => {
    const req = (ws as any)._req as IncomingMessage;
    const roomCode = (ws as any)._room as string;
    const roleHint = (ws as any)._roleHint as string;
    const devType = detectDeviceType(req);

    if (!roomCode) {
      // No room code — this is a new primary device
      handlePrimaryWebSocket(ws, req);
    } else {
      // Room code provided — join as secondary
      const room = rooms.get(roomCode);
      if (!room) {
        console.log(`[${APP_NAME}] Session rejected — room "${roomCode}" not found`);
        ws.send(JSON.stringify({ type: "error", message: `Room "${roomCode}" not found` }));
        ws.close();
        return;
      }
      handleSecondaryWebSocket(ws, room, roomCode, devType, roleHint);
    }
  });

  // -----------------------------------------------------------------
  // /ws/dialog — Legacy primary endpoint (backwards compat)
  // -----------------------------------------------------------------

  wssDialog.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    handlePrimaryWebSocket(ws, req);
  });

  wssSpectator.on("connection", (ws: WebSocket) => {
    console.log(`[${APP_NAME}] Spectator connected (total: ${spectators.size + 1})`);
    spectators.add(ws);
    ws.on("close", () => {
      spectators.delete(ws);
      console.log(`[${APP_NAME}] Spectator disconnected (total: ${spectators.size})`);
    });
    ws.on("error", () => {
      spectators.delete(ws);
    });
  });

  wssCamera.on("connection", (ws: WebSocket) => {
    const room = (ws as any)._room as string;
    const session = rooms.get(room);
    if (!session) {
      console.log(`[${APP_NAME}] Camera rejected — room "${room}" not found`);
      ws.send(JSON.stringify({ type: "error", message: `Room "${room}" not found` }));
      ws.close();
      return;
    }

    console.log(`[${APP_NAME}] Remote camera connected to room "${room}"`);
    ws.send(JSON.stringify({ type: "camera_connected", room }));

    ws.on("message", (data: Buffer | string) => {
      if (typeof data === "string") {
        try {
          const msg = JSON.parse(data);
          if (msg.type === "video_frame" && msg.data) {
            const frameBytes = Buffer.from(msg.data, "base64");
            session.sendRealtimeInput({
              media: {
                data: frameBytes.toString("base64"),
                mimeType: "image/jpeg",
              },
            });
          }
        } catch {}
      }
    });

    ws.on("close", () => {
      console.log(`[${APP_NAME}] Remote camera disconnected from room "${room}"`);
    });
  });

  // -----------------------------------------------------------------
  // /ws/midi — Ubuntu bridge forwards MIDI events to Gemini + iPad
  // -----------------------------------------------------------------

  function flushMidiToGemini(roomSession: RoomSession) {
    if (roomSession.midiBuffer.length === 0) return;

    const recentNotes = roomSession.midiBuffer
      .filter((m) => m.event === "noteOn")
      .slice(-8)
      .map((m) => ({ note: m.note, velocity: m.velocity }));

    const activeNotes: Array<{ note: number; velocity: number }> = [];
    const noteOnMap = new Map<number, number>();
    for (const m of roomSession.midiBuffer) {
      if (m.event === "noteOn") {
        noteOnMap.set(m.note, m.velocity);
      } else if (m.event === "noteOff") {
        noteOnMap.delete(m.note);
      }
    }
    for (const [note, velocity] of noteOnMap) {
      activeNotes.push({ note, velocity });
    }

    const summary = describeMidiSnapshot(
      { recent_notes: recentNotes, active_notes: activeNotes, pedal_down: false },
      roomSession.cameraEnabled,
      roomSession.bothHandsDetected,
      roomSession.detectedHandCount
    );

    if (summary) {
      roomSession.sendClientContent({
        turns: { role: "user", parts: [{ text: summary }] },
        turnComplete: true,
      });
    }

    roomSession.midiBuffer = [];
  }

  wssMidi.on("connection", (ws: WebSocket) => {
    const room = (ws as any)._room as string;
    const roomSession = rooms.get(room);
    if (!roomSession) {
      console.log(`[${APP_NAME}] MIDI rejected — room "${room}" not found`);
      ws.send(JSON.stringify({ type: "error", message: `Room "${room}" not found` }));
      ws.close();
      return;
    }

    console.log(`[${APP_NAME}] MIDI bridge connected to room "${room}"`);
    ws.send(JSON.stringify({ type: "midi_connected", room }));

    ws.on("message", (data: Buffer | string) => {
      if (typeof data !== "string") return;
      try {
        const msg = JSON.parse(data);
        if (msg.type !== "midi") return;

        // Forward raw MIDI event to all room devices for waterfall rendering
        broadcastToRoom(roomSession, JSON.stringify(msg));

        // Buffer for Gemini (flush every 2 seconds)
        if (msg.event === "noteOn" || msg.event === "noteOff") {
          roomSession.midiBuffer.push({
            note: msg.note ?? 0,
            velocity: msg.velocity ?? 0,
            event: msg.event,
            timestampMs: msg.timestampMs ?? Date.now(),
          });

          if (!roomSession.midiFlushTimer) {
            roomSession.midiFlushTimer = setTimeout(() => {
              roomSession.midiFlushTimer = null;
              flushMidiToGemini(roomSession);
            }, 2000);
          }
        }
      } catch {}
    });

    ws.on("close", () => {
      console.log(`[${APP_NAME}] MIDI bridge disconnected from room "${room}"`);
      if (roomSession.midiFlushTimer) {
        clearTimeout(roomSession.midiFlushTimer);
        roomSession.midiFlushTimer = null;
        flushMidiToGemini(roomSession);
      }
    });
  });

  return server;
}

// =========================================================================
// Async WebSocket message generator
// =========================================================================

async function* wsMessages(
  ws: WebSocket
): AsyncGenerator<Buffer | string, void, undefined> {
  const queue: (Buffer | string)[] = [];
  let resolve: (() => void) | null = null;
  let done = false;

  ws.on("message", (data: Buffer | string) => {
    queue.push(data);
    if (resolve) {
      resolve();
      resolve = null;
    }
  });

  ws.on("close", () => {
    done = true;
    if (resolve) {
      resolve();
      resolve = null;
    }
  });

  ws.on("error", () => {
    done = true;
    if (resolve) {
      resolve();
      resolve = null;
    }
  });

  while (true) {
    if (queue.length > 0) {
      yield queue.shift()!;
    } else if (done) {
      return;
    } else {
      await new Promise<void>((r) => {
        resolve = r;
      });
    }
  }
}

// =========================================================================
// Secondary device handler — joins an existing room
// =========================================================================

async function handleSecondaryWebSocket(
  ws: WebSocket,
  room: RoomSession,
  roomCode: string,
  devType: "desktop" | "tablet" | "phone" | "unknown",
  roleHint: string
) {
  const deviceId = randomHex(4);
  const device: Device = {
    id: deviceId,
    ws,
    name: deviceTypeName(devType),
    deviceType: devType,
    isPrimary: false,
    roles: { mic: false, camera: false, midi: false },
    connectedAt: Date.now(),
  };

  room.devices.set(deviceId, device);
  console.log(`[${APP_NAME}] Secondary device ${deviceId} (${devType}) joined room "${roomCode}"`);

  // Send identity to the secondary device
  ws.send(JSON.stringify({
    type: "you_are_secondary",
    room: roomCode,
    deviceId,
    deviceType: devType,
  }));

  // If role hint provided, auto-assign that role
  if (roleHint === "camera" || roleHint === "mic" || roleHint === "midi") {
    setDeviceRole(room, deviceId, roleHint as keyof DeviceRoles, true);
  }

  // Broadcast updated device list
  sendDeviceList(room);

  // Handle incoming messages from secondary
  try {
    for await (const rawMsg of wsMessages(ws)) {
      // Binary = PCM audio (only if this device has mic role)
      if (rawMsg instanceof Buffer || rawMsg instanceof ArrayBuffer) {
        if (!device.roles.mic) continue;
        const data = rawMsg instanceof ArrayBuffer ? new Uint8Array(rawMsg) : rawMsg;
        room.sendRealtimeInput({
          audio: {
            data: Buffer.from(data).toString("base64"),
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } else if (typeof rawMsg === "string") {
        const msg = JSON.parse(rawMsg);
        const msgType = msg.type;

        if (msgType === "video_frame" && device.roles.camera) {
          const frameBytes = Buffer.from(msg.data, "base64");
          room.sendRealtimeInput({
            media: {
              data: frameBytes.toString("base64"),
              mimeType: "image/jpeg",
            },
          });
        } else if (msgType === "midi_snapshot" && device.roles.midi) {
          const summary = describeMidiSnapshot(
            msg,
            room.cameraEnabled,
            room.bothHandsDetected,
            room.detectedHandCount
          );
          if (summary) {
            room.sendClientContent({
              turns: { role: "user", parts: [{ text: summary }] },
              turnComplete: true,
            });
          }
        } else if (msgType === "midi_event" && device.roles.midi) {
          // Forward raw MIDI to all room devices for visualization
          broadcastToRoom(room, JSON.stringify(msg));
        } else if (msgType === "text") {
          room.sendClientContent({
            turns: { role: "user", parts: [{ text: msg.content }] },
            turnComplete: true,
          });
        } else if (msgType === "camera_state") {
          if (device.roles.camera) {
            room.cameraEnabled = Boolean(msg.enabled);
            if (!room.cameraEnabled) {
              room.bothHandsDetected = false;
              room.detectedHandCount = 0;
            }
          }
        } else if (msgType === "hand_state") {
          if (device.roles.camera) {
            room.detectedHandCount = parseInt(msg.detected_count ?? "0", 10);
            room.bothHandsDetected = Boolean(msg.both_hands_detected);
          }
        } else if (msgType === "device_info") {
          // Device sends its name
          if (msg.name) device.name = String(msg.name).slice(0, 32);
          sendDeviceList(room);
        } else if (msgType === "close") {
          break;
        }
      }
    }
  } catch (e: any) {
    console.log(`[${APP_NAME}] Secondary ${deviceId} error:`, e?.message);
  } finally {
    room.devices.delete(deviceId);
    console.log(`[${APP_NAME}] Secondary device ${deviceId} disconnected from room "${roomCode}"`);
    sendDeviceList(room);
    try { ws.close(); } catch {}
  }
}

// =========================================================================
// Primary WebSocket handler — creates Gemini Live session
// =========================================================================

async function handlePrimaryWebSocket(ws: WebSocket, req: IncomingMessage) {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    ws.send(JSON.stringify({ type: "error", message: "No API key configured" }));
    ws.close();
    return;
  }

  const sessionId = randomHex(4);
  const roomCode = generateRoomCode();
  let closed = false;

  // Per-session state
  let cameraEnabled = true;
  let bothHandsDetected = false;
  let detectedHandCount = 0;

  // Transcription buffers (gated on user speech)
  let bufInput = "";
  let bufOutput = "";
  let turnHasUserSpeech = false;
  const pendingAudioChunks: Buffer[] = [];

  // Device registration for primary
  const devType = detectDeviceType(req);
  const primaryDeviceId = randomHex(4);
  const primaryDevice: Device = {
    id: primaryDeviceId,
    ws,
    name: deviceTypeName(devType) + " (Primary)",
    deviceType: devType,
    isPrimary: true,
    roles: { mic: true, camera: false, midi: false },
    connectedAt: Date.now(),
  };

  console.log(`[${APP_NAME}] Primary connected: ${sessionId}, room: ${roomCode}, device: ${primaryDeviceId}`);

  // ---------------------------------------------------------------------------
  // Gemini Live API via @google/genai SDK
  // ---------------------------------------------------------------------------
  const client = new GoogleGenAI({ apiKey });

  // We need session reference inside callbacks, so declare it first
  let session: Session;

  // Room session — created after successful connect
  let roomSession: RoomSession | null = null;

  try {
    session = await client.live.connect({
      model: LIVE_MODEL,
      // MINIMAL config — just audio response, nothing else
      config: {
        responseModalities: [Modality.AUDIO],
      },
      callbacks: {
        onopen: () => {
          console.log(`[${APP_NAME}] Gemini Live connected: ${sessionId}`);

          // Register room and notify client
          roomSession = {
            sendRealtimeInput: (input: any) => session.sendRealtimeInput(input),
            sendClientContent: (content: any) => session.sendClientContent(content),
            primaryWs: ws,
            devices: new Map(),
            midiBuffer: [],
            midiFlushTimer: null,
            cameraEnabled,
            bothHandsDetected,
            detectedHandCount,
          };
          roomSession.devices.set(primaryDeviceId, primaryDevice);
          rooms.set(roomCode, roomSession);

          ws.send(JSON.stringify({
            type: "you_are_primary",
            room: roomCode,
            deviceId: primaryDeviceId,
          }));
          ws.send(JSON.stringify({ type: "room_code", room: roomCode }));
          sendDeviceList(roomSession);
        },
        onerror: (e: unknown) => {
          console.error(`[${APP_NAME}] Gemini error: ${sessionId}`, e);
          if (!closed && ws.readyState === WebSocket.OPEN) {
            try { ws.send(JSON.stringify({ type: "gemini_error", error: String(e) })); } catch {}
          }
        },
        onclose: () => {
          console.error(`[${APP_NAME}] *** Gemini closed: session=${sessionId}`);
          closed = true;
          if (ws.readyState === WebSocket.OPEN) {
            try { ws.send(JSON.stringify({ type: "gemini_error", code: 1000, reason: "Session ended" })); } catch {}
            try { ws.close(); } catch {}
          }
        },
        onmessage: (msg: unknown) => {
          if (closed || !roomSession) return;
          try {
            processGeminiMessage(msg, roomSession, ws, session, {
              bufInput: () => bufInput,
              setBufInput: (v: string) => { bufInput = v; },
              bufOutput: () => bufOutput,
              setBufOutput: (v: string) => { bufOutput = v; },
              turnHasUserSpeech: () => turnHasUserSpeech,
              setTurnHasUserSpeech: (v: boolean) => { turnHasUserSpeech = v; },
              pendingAudioChunks,
            });
          } catch (e: any) {
            console.log(`[${APP_NAME}] onmessage error:`, e?.message);
          }
        },
      },
    });
  } catch (err) {
    console.error(`[${APP_NAME}] Failed to connect Gemini Live:`, err);
    ws.send(JSON.stringify({ type: "error", message: "Failed to connect to Gemini" }));
    ws.close(1011, "Failed to connect to Gemini");
    return;
  }

  console.log(`[${APP_NAME}] Gemini session ready: ${sessionId}, room: ${roomCode}`);

  // ---------------------------------------------------------------------------
  // Receive from primary client, forward to Gemini
  // ---------------------------------------------------------------------------
  try {
    for await (const rawMsg of wsMessages(ws)) {
      if (closed) break;

      // Binary = PCM audio at 16kHz (only if primary has mic role)
      if (rawMsg instanceof Buffer || rawMsg instanceof ArrayBuffer) {
        if (!primaryDevice.roles.mic) continue;
        const data =
          rawMsg instanceof ArrayBuffer
            ? new Uint8Array(rawMsg)
            : rawMsg;
        session.sendRealtimeInput({
          audio: {
            data: Buffer.from(data).toString("base64"),
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } else if (typeof rawMsg === "string") {
        const msg = JSON.parse(rawMsg);
        const msgType = msg.type;

        if (msgType === "video_frame") {
          if (!primaryDevice.roles.camera) continue;
          const frameBytes = Buffer.from(msg.data, "base64");
          session.sendRealtimeInput({
            media: {
              data: frameBytes.toString("base64"),
              mimeType: "image/jpeg",
            },
          });
        } else if (msgType === "text") {
          session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: msg.content }] }],
            turnComplete: true,
          });
        } else if (msgType === "midi_snapshot") {
          if (!primaryDevice.roles.midi) continue;
          const summary = describeMidiSnapshot(
            msg,
            cameraEnabled,
            bothHandsDetected,
            detectedHandCount
          );
          if (summary) {
            session.sendClientContent({
              turns: [{ role: "user", parts: [{ text: summary }] }],
              turnComplete: true,
            });
          }
        } else if (msgType === "set_mode") {
          // Single agent — mode is always storyteller
        } else if (msgType === "camera_state") {
          if (primaryDevice.roles.camera) {
            cameraEnabled = Boolean(msg.enabled);
            if (!cameraEnabled) {
              bothHandsDetected = false;
              detectedHandCount = 0;
            }
            if (roomSession) {
              (roomSession as RoomSession).cameraEnabled = cameraEnabled;
              (roomSession as RoomSession).bothHandsDetected = bothHandsDetected;
              (roomSession as RoomSession).detectedHandCount = detectedHandCount;
            }
          }
        } else if (msgType === "hand_state") {
          if (primaryDevice.roles.camera) {
            detectedHandCount = parseInt(msg.detected_count ?? "0", 10);
            bothHandsDetected = Boolean(msg.both_hands_detected);
            if (roomSession) {
              (roomSession as RoomSession).bothHandsDetected = bothHandsDetected;
              (roomSession as RoomSession).detectedHandCount = detectedHandCount;
            }
          }
        } else if (msgType === "midi_event") {
          // Frontend uses raw MIDI events for UI rendering; snapshots go to agent
        } else if (msgType === "set_device_role") {
          const { deviceId, role, enabled } = msg;
          if (roomSession && (role === "mic" || role === "camera" || role === "midi")) {
            setDeviceRole(roomSession as RoomSession, deviceId, role, Boolean(enabled));
            console.log(`[${APP_NAME}] Role ${role}=${enabled} on device ${deviceId}`);
          }
        } else if (msgType === "close") {
          break;
        }
      }
    }
  } catch (e: any) {
    if (!closed) console.log(`[${APP_NAME}] receive error:`, e?.message);
  }

  closed = true;
  try { session.close(); } catch {}

  // Cleanup
  const rs = rooms.get(roomCode);
  if (rs?.midiFlushTimer) clearTimeout(rs.midiFlushTimer);
  if (rs) {
    for (const d of rs.devices.values()) {
      if (!d.isPrimary && d.ws.readyState === WebSocket.OPEN) {
        try {
          d.ws.send(JSON.stringify({ type: "room_closed" }));
          d.ws.close();
        } catch {}
      }
    }
  }
  rooms.delete(roomCode);
  console.log(`[${APP_NAME}] Primary disconnected: ${sessionId}, room ${roomCode} removed`);
  try { ws.close(); } catch {}
}

// =========================================================================
// Process a single Gemini Live message (SDK callback)
// =========================================================================

interface TranscriptState {
  bufInput: () => string;
  setBufInput: (v: string) => void;
  bufOutput: () => string;
  setBufOutput: (v: string) => void;
  turnHasUserSpeech: () => boolean;
  setTurnHasUserSpeech: (v: boolean) => void;
  pendingAudioChunks: Buffer[];
}

function processGeminiMessage(
  msg: unknown,
  roomSession: RoomSession,
  ws: WebSocket,
  session: Session,
  state: TranscriptState
): void {
  const message = msg as Record<string, unknown>;

  const sendAll = (data: Buffer | string, binary = false) => {
    broadcastToRoom(roomSession, data, binary);
  };

  // serverContent — audio, transcription, turn events
  const serverContent = message.serverContent as Record<string, unknown> | undefined;
  if (serverContent) {
    const modelTurn = serverContent.modelTurn as Record<string, unknown> | undefined;
    if (modelTurn?.parts) {
      const parts = modelTurn.parts as Array<Record<string, unknown>>;
      for (const part of parts) {
        const inlineData = part.inlineData as Record<string, unknown> | undefined;
        if (inlineData?.data) {
          const audioBuffer = Buffer.from(inlineData.data as string, "base64");
          if (state.turnHasUserSpeech()) {
            sendAll(audioBuffer, true);
          } else {
            state.pendingAudioChunks.push(audioBuffer);
          }
        }
      }
    }

    // Input transcription (user speech)
    const inputTranscription = serverContent.inputTranscription as Record<string, unknown> | undefined;
    if (inputTranscription?.text) {
      const text = (inputTranscription.text as string).trim();
      if (text) {
        state.setBufInput(text);
        state.setTurnHasUserSpeech(true);
        while (state.pendingAudioChunks.length > 0) {
          sendAll(state.pendingAudioChunks.shift()!, true);
        }
      }
    }

    // Output transcription
    const outputTranscription = serverContent.outputTranscription as Record<string, unknown> | undefined;
    if (outputTranscription?.text) {
      const text = (outputTranscription.text as string).trim();
      if (text) state.setBufOutput(text);
    }

    // Turn complete
    if (serverContent.turnComplete) {
      if (state.turnHasUserSpeech() && state.bufInput()) {
        sendAll(JSON.stringify({ type: "input_transcript", text: state.bufInput() }));
        state.setBufInput("");
      }
      if (state.turnHasUserSpeech() && state.bufOutput()) {
        sendAll(JSON.stringify({ type: "output_transcript", text: state.bufOutput() }));
        state.setBufOutput("");
      }
      state.pendingAudioChunks.length = 0;
      if (state.turnHasUserSpeech()) {
        sendAll(JSON.stringify({ type: "turn_complete" }));
      }
      state.setTurnHasUserSpeech(false);
    }

    // Interrupted
    if (serverContent.interrupted) {
      if (state.turnHasUserSpeech() && state.bufInput()) {
        sendAll(JSON.stringify({ type: "input_transcript", text: state.bufInput() }));
        state.setBufInput("");
      }
      if (state.turnHasUserSpeech() && state.bufOutput()) {
        sendAll(JSON.stringify({ type: "output_transcript", text: state.bufOutput() }));
        state.setBufOutput("");
      }
      state.pendingAudioChunks.length = 0;
      if (state.turnHasUserSpeech()) {
        sendAll(JSON.stringify({ type: "interrupted" }));
      }
      state.setTurnHasUserSpeech(false);
    }
  }

  // Tool calls — execute and respond
  const toolCall = message.toolCall as Record<string, unknown> | undefined;
  if (toolCall?.functionCalls) {
    const functionCalls = toolCall.functionCalls as Array<Record<string, unknown>>;
    const toolResponses: Array<{ id: string; name: string; response: Record<string, unknown> }> = [];

    for (const fc of functionCalls) {
      const name = fc.name as string;
      const id = fc.id as string;
      const args = (fc.args as Record<string, unknown>) || {};

      const visualEvent = toolCallToVisualEvent(name, args);
      if (visualEvent) {
        sendAll(JSON.stringify(visualEvent));
      }

      sendAll(JSON.stringify({ type: "tool_call", name, args }));

      const result = executeToolLocally(name, args);
      sendAll(JSON.stringify({ type: "tool_result", name, result }));

      toolResponses.push({ id, name, response: result });
    }

    session.sendToolResponse({ functionResponses: toolResponses });
  }
}
