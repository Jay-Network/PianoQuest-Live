/**
 * PianoQuest Live — Express + WebSocket server with Gemini Live API.
 *
 * Uses @google/genai SDK live.connect() for Gemini Live sessions.
 */

import express from "express";
import { createServer } from "http";
import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
// Gemini Live API now runs in the browser — server is a lightweight coordinator

const APP_NAME = "pianoquest";
const STATIC_DIR = path.join(__dirname, "..", "..", "static");
const SHEETS_DIR = path.join(__dirname, "..", "..", "sheets");
const DEFAULT_RECORDINGS_DIR = path.join(
  process.env.HOME ?? "/tmp",
  ".pianoquest",
  "recordings"
);


const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiNoteName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  return `${NOTE_NAMES[note % 12]}${octave}`;
}

function describeMidiSnapshot(
  msg: Record<string, unknown>,
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

  return (
    "[MIDI snapshot] " +
    details.join(". ")
  );
}

// =========================================================================
// Spectator broadcasting — spectators receive all output but send nothing
// =========================================================================

const spectators = new Set<WebSocket>();

/** Only one room streams to spectators at a time */
let liveRoomCode: string | null = null;

// =========================================================================
// Status tracking — proactive health monitoring for all connections
// =========================================================================

interface SystemStatus {
  desktopBridge: {
    connected: boolean;
    url: string;
    connectedAt: number | null;
    disconnectedAt: number | null;
    lastMidiEvent: number | null;
    midiEventCount: number;
    reconnectAttempts: number;
  };
  room: {
    code: string;
    live: boolean;
    deviceCount: number;
    primaryConnected: boolean;
    primaryConnectedAt: number | null;
  };
  gemini: {
    connected: boolean;
    connectedAt: number | null;
    sessionId: string | null;
    audioChunksSent: number;
  };
  coaching: {
    active: boolean;
    startedAt: number | null;
  };
  spectators: {
    count: number;
  };
  uptime: number;
}

const serverStartTime = Date.now();

const statusTracker = {
  desktopBridge: {
    connected: false,
    url: "",
    connectedAt: null as number | null,
    disconnectedAt: null as number | null,
    lastMidiEvent: null as number | null,
    midiEventCount: 0,
    reconnectAttempts: 0,
  },
  gemini: {
    connected: false,
    connectedAt: null as number | null,
    sessionId: null as string | null,
    audioChunksSent: 0,
  },
  coaching: {
    active: false,
    startedAt: null as number | null,
  },
  primaryConnectedAt: null as number | null,
};

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
  roomCode: string;
  primaryWs: WebSocket;
  /** All devices in this room */
  devices: Map<string, Device>;
  /** Accumulated MIDI notes for periodic Gemini snapshots */
  midiBuffer: Array<{ note: number; velocity: number; event: string; timestampMs: number }>;
  midiFlushTimer: ReturnType<typeof setTimeout> | null;
  cameraEnabled: boolean;
  bothHandsDetected: boolean;
  _lastGeminiFrame: number;
  /** Latest MIDI summary — injected when user speaks, not sent independently */
  lastMidiSummary: string | null;
  /** Current session settings (scale, bpm, timeSignature) for spectator sync */
  sessionSettings: { scale: string; bpm: number; timeSignature: string };
}

const rooms = new Map<string, RoomSession>();
const DEFAULT_ROOM = "HOME";

/** Create the default persistent room — always exists, no browser needed */
function ensureDefaultRoom(): RoomSession {
  let room = rooms.get(DEFAULT_ROOM);
  if (!room) {
    room = {
      roomCode: DEFAULT_ROOM,
      primaryWs: null as any,
      devices: new Map(),
      midiBuffer: [],
      midiFlushTimer: null,
      cameraEnabled: false,
      bothHandsDetected: false,
      _lastGeminiFrame: 0,
      lastMidiSummary: null,
      sessionSettings: { scale: "C major", bpm: 90, timeSignature: "4/4" },
    };
    rooms.set(DEFAULT_ROOM, room);
    liveRoomCode = DEFAULT_ROOM;
    console.log(`[${APP_NAME}] Default room "${DEFAULT_ROOM}" created (auto-live)`);
  }
  return room;
}

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
  // Only stream to spectators if this room is the live room
  if (liveRoomCode && room.roomCode === liveRoomCode) {
    broadcastSpectators(data, binary);
  }
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
  const wssMidi = new WebSocketServer({ noServer: true });
  const wssSession = new WebSocketServer({ noServer: true });
  const wssBot = new WebSocketServer({ noServer: true });
  const botClients = new Set<WebSocket>();

  // Bridge livestream status (ws://localhost:3491/ws)
  let streamLive = false;
  let streamViewers = 0;
  function connectBridge() {
    try {
      const bws = new WebSocket("ws://localhost:3491/ws");
      bws.on("open", () => console.log(`[${APP_NAME}] Bridge connected`));
      bws.on("message", (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === "streamStatus") {
            streamLive = !!msg.live;
            streamViewers = msg.viewers || 0;
          }
        } catch (_) {}
      });
      bws.on("close", () => {
        console.log(`[${APP_NAME}] Bridge disconnected, reconnecting in 5s`);
        setTimeout(connectBridge, 5000);
      });
      bws.on("error", () => {
        bws.close();
      });
    } catch (_) {
      setTimeout(connectBridge, 5000);
    }
  }
  connectBridge();

  // Auth handled by Cloudflare Zero Trust — no app-level gate needed

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: APP_NAME,
      modes: ["storyteller"],
      spectators: spectators.size,
      rooms: rooms.size,
      desktopBridge: statusTracker.desktopBridge.connected,
      gemini: statusTracker.gemini.connected,
      streamLive,
      streamViewers,
    });
  });

  app.get("/status", (_req, res) => {
    const room = rooms.get(DEFAULT_ROOM);
    const now = Date.now();
    const status: SystemStatus = {
      desktopBridge: { ...statusTracker.desktopBridge },
      room: {
        code: DEFAULT_ROOM,
        live: liveRoomCode === DEFAULT_ROOM,
        deviceCount: room ? room.devices.size : 0,
        primaryConnected: !!(room && room.primaryWs && room.primaryWs.readyState === WebSocket.OPEN),
        primaryConnectedAt: statusTracker.primaryConnectedAt,
      },
      gemini: { ...statusTracker.gemini },
      coaching: { ...statusTracker.coaching },
      spectators: { count: spectators.size },
      uptime: Math.floor((now - serverStartTime) / 1000),
    };
    res.json(status);
  });

  app.get("/api/gemini-key", (_req, res) => {
    const key = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? "";
    if (!key) return res.status(503).json({ error: "No API key configured" });
    res.json({ key });
  });

  app.get("/", (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, "index.html"));
  });

  app.get("/terminal", (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, "terminal.html"));
  });

  app.use("/static", express.static(STATIC_DIR));
  app.use("/sheets", express.static(SHEETS_DIR));
  // PWA manifest and icons at root
  app.get("/manifest.json", (_req, res) => res.sendFile(path.join(STATIC_DIR, "manifest.json")));
  app.use("/icons", express.static(path.join(STATIC_DIR, "icons")));

  // List sheet music files as a tree (with layout/text/pdf availability)
  app.get("/api/sheets", (_req, res) => {
    function walkDir(dir: string, prefix: string): any[] {
      const entries: any[] = [];
      if (!fs.existsSync(dir)) return entries;
      const allFiles = fs.readdirSync(dir).sort();
      for (const name of allFiles) {
        const full = path.join(dir, name);
        const rel = prefix ? `${prefix}/${name}` : name;
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          entries.push({ name, path: rel, type: "directory", children: walkDir(full, rel) });
        } else if (name.endsWith(".json") && !name.endsWith(".layout.json") && !name.endsWith(".text.json")) {
          const base = name.replace(/\.json$/, "");
          const hasLayout = allFiles.includes(base + ".layout.json");
          const hasText = allFiles.includes(base + ".text.json");
          const hasPdf = allFiles.includes(base + ".pdf");
          const hasPng = allFiles.includes(base + ".png");
          entries.push({
            name: base,
            path: rel,
            type: "file",
            hasLayout,
            hasText,
            hasPdf: hasPdf || hasPng,
            pdfExt: hasPdf ? ".pdf" : hasPng ? ".png" : null,
          });
        }
      }
      return entries;
    }
    res.json(walkDir(SHEETS_DIR, ""));
  });

  // -----------------------------------------------------------------------
  // Recording API — save/list/load/delete recordings
  // -----------------------------------------------------------------------

  app.use(express.json({ limit: "10mb" }));

  function getRecDir(customDir?: string, user?: string): string {
    const base = customDir || DEFAULT_RECORDINGS_DIR;
    const safeName = (user || "").replace(/[^a-zA-Z0-9_\-]/g, "").toLowerCase();
    const dir = safeName ? path.join(base, safeName) : base;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  // List recordings in a directory
  app.get("/api/recordings", (req, res) => {
    const dir = getRecDir(req.query.dir as string | undefined, req.query.user as string | undefined);
    try {
      const files = fs.readdirSync(dir)
        .filter((f: string) => f.endsWith(".json"))
        .map((f: string) => {
          const full = path.join(dir, f);
          const stat = fs.statSync(full);
          try {
            const data = JSON.parse(fs.readFileSync(full, "utf-8"));
            const events = Array.isArray(data.events) ? data.events : [];
            const duration = data.duration || (data.endTimeMs && data.startTimeMs ? data.endTimeMs - data.startTimeMs : 0);
            const noteCount = data.noteCount || events.filter((e: any) => e.type === "note_on" || e.event === "noteOn").length;
            return {
              filename: f,
              name: data.name || f.replace(/\.json$/, ""),
              duration,
              noteCount,
              createdAt: data.startTimeMs || stat.mtimeMs,
            };
          } catch {
            return { filename: f, name: f.replace(/\.json$/, ""), duration: 0, noteCount: 0, createdAt: stat.mtimeMs };
          }
        })
        .sort((a: any, b: any) => b.createdAt - a.createdAt);
      res.json({ dir, recordings: files });
    } catch (e: any) {
      res.json({ dir, recordings: [], error: e.message });
    }
  });

  // Save a recording
  app.post("/api/recordings", (req, res) => {
    const { name, recording, dir: customDir, user } = req.body;
    const dir = getRecDir(customDir, user);
    const safeName = (name || "recording").replace(/[^a-zA-Z0-9_\-\s]/g, "").trim() || "recording";
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${safeName}_${ts}.json`;
    const full = path.join(dir, filename);
    recording.name = safeName;
    fs.writeFileSync(full, JSON.stringify(recording, null, 2));
    console.log(`[${APP_NAME}] Recording saved: ${full} (${recording.noteCount || 0} notes)`);
    res.json({ ok: true, filename, path: full });
  });

  // Load a recording
  app.get("/api/recordings/:filename", (req, res) => {
    const dir = getRecDir(req.query.dir as string | undefined, req.query.user as string | undefined);
    const full = path.join(dir, req.params.filename);
    if (!fs.existsSync(full)) { res.status(404).json({ error: "Not found" }); return; }
    res.json(JSON.parse(fs.readFileSync(full, "utf-8")));
  });

  // Delete a recording
  app.patch("/api/recordings/:filename", (req, res) => {
    const dir = getRecDir(req.query.dir as string | undefined, req.query.user as string | undefined);
    const full = path.join(dir, req.params.filename);
    if (!fs.existsSync(full)) { res.status(404).json({ error: "Not found" }); return; }
    const newName = (req.body.name || "").trim();
    if (!newName) { res.status(400).json({ error: "Name required" }); return; }
    const safeName = newName.replace(/[<>:"/\\|?*]/g, "_");
    const newFilename = safeName + (safeName.endsWith(".json") ? "" : ".json");
    const newFull = path.join(dir, newFilename);
    if (fs.existsSync(newFull) && newFull !== full) { res.status(409).json({ error: "Name already exists" }); return; }
    fs.renameSync(full, newFull);
    console.log(`[${APP_NAME}] Recording renamed: ${req.params.filename} → ${newFilename}`);
    res.json({ ok: true, filename: newFilename });
  });

  app.delete("/api/recordings/:filename", (req, res) => {
    const dir = getRecDir(req.query.dir as string | undefined, req.query.user as string | undefined);
    const full = path.join(dir, req.params.filename);
    if (!fs.existsSync(full)) { res.status(404).json({ error: "Not found" }); return; }
    fs.unlinkSync(full);
    console.log(`[${APP_NAME}] Recording deleted: ${full}`);
    res.json({ ok: true });
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
    } else if (url.pathname === "/ws/bot") {
      wssBot.handleUpgrade(request, socket, head, (ws) => {
        wssBot.emit("connection", ws, request);
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

  // -----------------------------------------------------------------
  // /ws/bot — Bot terminal (jworks:95) relay
  // -----------------------------------------------------------------

  const BOT_TMUX_TARGET = process.env.BOT_TMUX_TARGET || "jworks:95";
  const BOT_POLL_MS = 500;

  function captureTmuxPane(target: string): string {
    try {
      return execFileSync("tmux", ["capture-pane", "-t", target, "-p", "-S", "-200"], {
        encoding: "utf-8",
        timeout: 3000,
      });
    } catch {
      return `[terminal not available: ${target}]`;
    }
  }

  wssBot.on("connection", (ws: WebSocket) => {
    botClients.add(ws);
    console.log(`[${APP_NAME}] Bot terminal connected (total: ${botClients.size})`);

    let lastContent = "";
    // Send initial full capture
    const initial = captureTmuxPane(BOT_TMUX_TARGET);
    lastContent = initial;
    ws.send(JSON.stringify({ type: "terminal_full", content: initial, target: BOT_TMUX_TARGET }));

    // Poll for changes
    const poll = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) { clearInterval(poll); return; }
      const content = captureTmuxPane(BOT_TMUX_TARGET);
      if (content !== lastContent) {
        lastContent = content;
        ws.send(JSON.stringify({ type: "terminal_full", content, target: BOT_TMUX_TARGET }));
      }
    }, BOT_POLL_MS);

    ws.on("message", (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "terminal_input" && typeof msg.data === "string") {
          execFileSync("tmux", ["send-keys", "-t", BOT_TMUX_TARGET, msg.data], { timeout: 3000 });
        } else if (msg.type === "terminal_enter") {
          execFileSync("tmux", ["send-keys", "-t", BOT_TMUX_TARGET, "Enter"], { timeout: 3000 });
        }
      } catch (_) {}
    });

    ws.on("close", () => {
      clearInterval(poll);
      botClients.delete(ws);
      console.log(`[${APP_NAME}] Bot terminal disconnected (total: ${botClients.size})`);
    });

    ws.on("error", () => {
      clearInterval(poll);
      botClients.delete(ws);
    });
  });

  wssSpectator.on("connection", (ws: WebSocket) => {
    spectators.add(ws);
    console.log(`[${APP_NAME}] Spectator connected (total: ${spectators.size})`);

    // Send immediate status — only report live room, not just any active session
    const liveRoom = liveRoomCode ? rooms.get(liveRoomCode) : null;
    ws.send(JSON.stringify({
      type: "spectator_status",
      connected: true,
      spectators: spectators.size,
      activeSession: !!liveRoom,
      room: liveRoomCode,
    }));

    // Send current session settings snapshot so spectator starts with correct values
    if (liveRoom) {
      ws.send(JSON.stringify({ type: "session_settings", ...liveRoom.sessionSettings }));
    }

    // Keepalive ping every 20s to prevent Cloud Run timeout
    let alive = true;
    const pingInterval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        clearInterval(pingInterval);
        return;
      }
      if (!alive) {
        // Missed pong — connection dead
        ws.terminate();
        return;
      }
      alive = false;
      ws.ping();
    }, 20000);

    ws.on("pong", () => { alive = true; });

    // Allow spectators to push session_settings back to the live room
    ws.on("message", (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(typeof raw === "string" ? raw : raw.toString());
        if (msg.type === "session_settings") {
          const room = liveRoomCode ? rooms.get(liveRoomCode) : null;
          if (room) {
            room.sessionSettings = {
              scale: String(msg.scale || room.sessionSettings.scale),
              bpm: Number(msg.bpm) || room.sessionSettings.bpm,
              timeSignature: String(msg.timeSignature || room.sessionSettings.timeSignature),
            };
            console.log(`[${APP_NAME}] Spectator pushed session_settings:`, room.sessionSettings);
            broadcastToRoom(room, JSON.stringify({ type: "session_settings", ...room.sessionSettings }));
          }
        }
      } catch {}
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      spectators.delete(ws);
      console.log(`[${APP_NAME}] Spectator disconnected (total: ${spectators.size})`);
    });
    ws.on("error", () => {
      clearInterval(pingInterval);
      spectators.delete(ws);
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
    );

    if (summary) {
      roomSession.lastMidiSummary = summary;
      // Send to primary browser — browser forwards to its Gemini session
      try {
        if (roomSession.primaryWs.readyState === WebSocket.OPEN) {
          roomSession.primaryWs.send(JSON.stringify({ type: "midi_for_gemini", summary }));
        }
      } catch {}
    }

    roomSession.midiBuffer = [];
  }

  wssMidi.on("connection", (ws: WebSocket) => {
    const room = (ws as any)._room as string || DEFAULT_ROOM;
    // Auto-create default room if MIDI bridge connects without a browser session
    const roomSession = rooms.get(room) || (room === DEFAULT_ROOM ? ensureDefaultRoom() : null);
    if (!roomSession) {
      console.log(`[${APP_NAME}] MIDI rejected — room "${room}" not found`);
      ws.send(JSON.stringify({ type: "error", message: `Room "${room}" not found` }));
      ws.close();
      return;
    }

    console.log(`[${APP_NAME}] MIDI bridge connected to room "${room}"`);
    ws.send(JSON.stringify({ type: "midi_connected", room }));
    // Notify room clients that bridge MIDI is active
    broadcastToRoom(roomSession, JSON.stringify({ type: "midi_source", source: "bridge" }));

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
      broadcastToRoom(roomSession, JSON.stringify({ type: "midi_source", source: "direct" }));
      if (roomSession.midiFlushTimer) {
        clearTimeout(roomSession.midiFlushTimer);
        roomSession.midiFlushTimer = null;
        flushMidiToGemini(roomSession);
      }
    });

    ws.on("error", () => {
      broadcastToRoom(roomSession, JSON.stringify({ type: "midi_source", source: "direct" }));
    });
  });

  // Create default persistent room on startup — no browser needed
  ensureDefaultRoom();

  // ---------------------------------------------------------------------------
  // Server-side MIDI bridge — connect to PQ Desktop :3490/ws and pipe into HOME room
  // No browser needed. Auto-reconnect if PQ Desktop restarts.
  // ---------------------------------------------------------------------------
  const PQ_DESKTOP_URL = process.env.PQ_DESKTOP_URL || "ws://127.0.0.1:3490/ws";
  statusTracker.desktopBridge.url = PQ_DESKTOP_URL;
  let desktopBridgeWs: WebSocket | null = null;
  let desktopBridgeReconnectDelay = 1000;

  function connectDesktopBridge() {
    try {
      desktopBridgeWs = new WebSocket(PQ_DESKTOP_URL);

      desktopBridgeWs.on("open", () => {
        console.log(`[${APP_NAME}] Desktop bridge connected to ${PQ_DESKTOP_URL}`);
        desktopBridgeReconnectDelay = 1000;
        statusTracker.desktopBridge.connected = true;
        statusTracker.desktopBridge.connectedAt = Date.now();
        statusTracker.desktopBridge.disconnectedAt = null;
        statusTracker.desktopBridge.reconnectAttempts = 0;
        const room = ensureDefaultRoom();
        broadcastToRoom(room, JSON.stringify({ type: "midi_source", source: "bridge" }));
      });

      desktopBridgeWs.on("message", (data: Buffer | string) => {
        try {
          const msg = JSON.parse(typeof data === "string" ? data : data.toString());
          if (msg.type === "heartbeat") return; // PQ Desktop sends heartbeats

          // Forward MIDI events to the HOME room + spectators
          if (msg.type === "midi" || msg.event === "noteOn" || msg.event === "noteOff" || msg.event === "controlChange" || msg.event === "pitchBend") {
            statusTracker.desktopBridge.lastMidiEvent = Date.now();
            statusTracker.desktopBridge.midiEventCount++;
            const midiMsg = { type: "midi", ...msg };
            const room = ensureDefaultRoom();
            broadcastToRoom(room, JSON.stringify(midiMsg));

            // Buffer for Gemini
            if (msg.event === "noteOn" || msg.event === "noteOff") {
              room.midiBuffer.push({
                note: msg.note ?? 0,
                velocity: msg.velocity ?? 0,
                event: msg.event,
                timestampMs: msg.timestampMs ?? Date.now(),
              });
              if (!room.midiFlushTimer) {
                room.midiFlushTimer = setTimeout(() => {
                  room.midiFlushTimer = null;
                  flushMidiToGemini(room);
                }, 2000);
              }
            }
          }
        } catch {}
      });

      desktopBridgeWs.on("close", () => {
        // Only log first few attempts; after cap, status log covers it
        if (desktopBridgeReconnectDelay < 60000) {
          console.log(`[${APP_NAME}] Desktop bridge disconnected, reconnecting in ${Math.round(desktopBridgeReconnectDelay / 1000)}s`);
        }
        desktopBridgeWs = null;
        statusTracker.desktopBridge.connected = false;
        statusTracker.desktopBridge.disconnectedAt = Date.now();
        statusTracker.desktopBridge.reconnectAttempts++;
        const room = rooms.get(DEFAULT_ROOM);
        if (room) broadcastToRoom(room, JSON.stringify({ type: "midi_source", source: "direct" }));
        setTimeout(connectDesktopBridge, desktopBridgeReconnectDelay);
        desktopBridgeReconnectDelay = Math.min(desktopBridgeReconnectDelay * 2, 300000);
      });

      desktopBridgeWs.on("error", () => {
        // Error triggers close event — reconnect handled there
      });
    } catch {
      setTimeout(connectDesktopBridge, desktopBridgeReconnectDelay);
      desktopBridgeReconnectDelay = Math.min(desktopBridgeReconnectDelay * 2, 300000);
    }
  }

  connectDesktopBridge();

  // Periodic status log — one-line health summary every 60s
  setInterval(() => {
    const room = rooms.get(DEFAULT_ROOM);
    const bridge = statusTracker.desktopBridge.connected ? "UP" : "DOWN";
    const gemini = statusTracker.gemini.connected ? "UP" : "OFF";
    const coaching = statusTracker.coaching.active ? "ON" : "OFF";
    const primary = room && room.primaryWs && room.primaryWs.readyState === WebSocket.OPEN ? "YES" : "NO";
    const devices = room ? room.devices.size : 0;
    const specs = spectators.size;
    const live = liveRoomCode === DEFAULT_ROOM ? "LIVE" : "OFF";
    const midiAge = statusTracker.desktopBridge.lastMidiEvent
      ? `${Math.floor((Date.now() - statusTracker.desktopBridge.lastMidiEvent) / 1000)}s ago`
      : "never";
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    console.log(
      `[${APP_NAME}] STATUS | bridge:${bridge} midi:${midiAge}(${statusTracker.desktopBridge.midiEventCount}) | ` +
      `gemini:${gemini} coaching:${coaching} | primary:${primary} devices:${devices} spectators:${specs} | ` +
      `stream:${live} | uptime:${uptime}s`
    );
  }, 60000);

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

  ws.on("message", (data: Buffer | string, isBinary: boolean) => {
    // ws library delivers ALL messages as Buffer; use isBinary to distinguish
    const item = isBinary ? data : data.toString();
    queue.push(item);
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

  // Keepalive ping every 20s to prevent Cloud Run from killing idle connections
  let secAlive = true;
  const secPingInterval = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) { clearInterval(secPingInterval); return; }
    if (!secAlive) { ws.terminate(); return; }
    secAlive = false;
    ws.ping();
  }, 20000);
  ws.on("pong", () => { secAlive = true; });

  // Send identity to the secondary device
  ws.send(JSON.stringify({
    type: "you_are_secondary",
    room: roomCode,
    deviceId,
    deviceType: devType,
  }));

  // If role hint provided, auto-assign that role
  if (roleHint === "mic" || roleHint === "midi" || roleHint === "camera") {
    setDeviceRole(room, deviceId, roleHint as keyof DeviceRoles, true);
  }

  // Broadcast updated device list
  sendDeviceList(room);

  // Handle incoming messages from secondary
  try {
    for await (const rawMsg of wsMessages(ws)) {
      // Binary = PCM audio (only if this device has mic role) — forward to primary browser for Gemini
      if (rawMsg instanceof Buffer || rawMsg instanceof ArrayBuffer) {
        if (!device.roles.mic) continue;
        const data = rawMsg instanceof ArrayBuffer ? new Uint8Array(rawMsg) : rawMsg;
        const b64 = Buffer.from(data).toString("base64");
        try {
          if (room.primaryWs.readyState === WebSocket.OPEN) {
            room.primaryWs.send(JSON.stringify({ type: "secondary_audio", data: b64 }));
          }
        } catch {}
      } else if (typeof rawMsg === "string") {
        const msg = JSON.parse(rawMsg);
        const msgType = msg.type;

        if (msgType === "midi_snapshot" && device.roles.midi) {
          const summary = describeMidiSnapshot(msg);
          if (summary) {
            room.lastMidiSummary = summary;
            // Forward to primary browser for Gemini
            try {
              if (room.primaryWs.readyState === WebSocket.OPEN) {
                room.primaryWs.send(JSON.stringify({ type: "midi_for_gemini", summary }));
              }
            } catch {}
          }
        } else if (msgType === "midi_event" && device.roles.midi) {
          // Forward raw MIDI to all room devices for visualization
          broadcastToRoom(room, JSON.stringify(msg));
        } else if (msgType === "video_frame" && device.roles.camera) {
          // Forward camera JPEG to all other devices (including primary — primary browser sends to Gemini)
          const data = msg.data as string;
          if (data) {
            for (const d of room.devices.values()) {
              if (d.id !== deviceId && d.ws.readyState === WebSocket.OPEN) {
                try { d.ws.send(JSON.stringify({ type: "video_frame", data })); } catch {}
              }
            }
          }
        } else if (msgType === "camera_state") {
          room.cameraEnabled = Boolean(msg.enabled);
          broadcastToRoom(room, JSON.stringify({ type: "camera_state", enabled: room.cameraEnabled }));
        } else if (msgType === "hand_state") {
          room.bothHandsDetected = Boolean(msg.bothHands);
          broadcastToRoom(room, JSON.stringify({ type: "hand_state", hands: msg.hands, bothHands: msg.bothHands }));
        } else if (msgType === "text") {
          // Forward to primary browser for Gemini
          try {
            if (room.primaryWs.readyState === WebSocket.OPEN) {
              room.primaryWs.send(JSON.stringify({ type: "text_for_gemini", content: msg.content }));
            }
          } catch {}
        } else if (msgType === "user_speech_transcript") {
          // Browser SpeechRecognition transcript — broadcast to all devices
          const text = (msg.text as string || "").trim();
          if (text) {
            broadcastToRoom(room, JSON.stringify({ type: "input_transcript", text }));
          }
        } else if (msgType === "request_role") {
          // Secondary device self-assigns a role
          const role = msg.role as string;
          if (role === "mic" || role === "midi" || role === "camera") {
            setDeviceRole(room, deviceId, role, Boolean(msg.enabled));
            console.log(`[${APP_NAME}] Secondary ${deviceId} self-assigned ${role}=${msg.enabled}`);
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
    clearInterval(secPingInterval);
    room.devices.delete(deviceId);
    console.log(`[${APP_NAME}] Secondary device ${deviceId} disconnected from room "${roomCode}"`);
    sendDeviceList(room);
    try { ws.close(); } catch {}
  }
}

// =========================================================================
// Primary WebSocket handler — room coordinator (Gemini runs in browser)
// =========================================================================

async function handlePrimaryWebSocket(ws: WebSocket, req: IncomingMessage) {
  const sessionId = randomHex(4);
  const roomCode = DEFAULT_ROOM;
  let closed = false;

  // Device registration for primary
  const devType = detectDeviceType(req);
  const primaryDeviceId = randomHex(4);
  const primaryDevice: Device = {
    id: primaryDeviceId,
    ws,
    name: deviceTypeName(devType) + " (Primary)",
    deviceType: devType,
    isPrimary: true,
    roles: { mic: true, camera: false, midi: true },
    connectedAt: Date.now(),
  };

  console.log(`[${APP_NAME}] Primary connected: ${sessionId}, room: ${DEFAULT_ROOM}, device: ${primaryDeviceId}`);
  statusTracker.primaryConnectedAt = Date.now();

  // ---------------------------------------------------------------------------
  // Room setup — join the default persistent room
  // ---------------------------------------------------------------------------
  const roomSession = ensureDefaultRoom();
  roomSession.primaryWs = ws;
  roomSession.devices.set(primaryDeviceId, primaryDevice);
  // Ensure live
  liveRoomCode = DEFAULT_ROOM;

  ws.send(JSON.stringify({ type: "you_are_primary", room: roomCode, deviceId: primaryDeviceId }));
  ws.send(JSON.stringify({ type: "room_code", room: roomCode }));
  sendDeviceList(roomSession);

  const sendAll = (data: Buffer | string, binary = false) => {
    broadcastToRoom(roomSession, data, binary);
  };

  // Gemini Live runs in the browser — server just coordinates
  console.log(`[${APP_NAME}] Room ${roomCode} ready (Gemini runs in browser)`);

  // Keepalive ping every 20s to prevent Cloud Run from killing the connection
  let primaryAlive = true;
  const primaryPingInterval = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) { clearInterval(primaryPingInterval); return; }
    if (!primaryAlive) { ws.terminate(); return; }
    primaryAlive = false;
    ws.ping();
  }, 20000);
  ws.on("pong", () => { primaryAlive = true; });

  // ---------------------------------------------------------------------------
  // Receive from primary client — Gemini runs in browser, server coordinates
  // ---------------------------------------------------------------------------
  try {
    for await (const rawMsg of wsMessages(ws)) {
      if (closed) break;

      if (rawMsg instanceof Buffer || rawMsg instanceof ArrayBuffer) {
        // Binary from primary = Gemini audio for spectator broadcast
        broadcastSpectators(rawMsg instanceof ArrayBuffer ? Buffer.from(rawMsg) : rawMsg, true);
      } else if (typeof rawMsg === "string") {
        const msg = JSON.parse(rawMsg);
        const msgType = msg.type;

        // Browser Gemini forwarding — broadcast to room + spectators
        if (msgType === "gemini_tool_event") {
          const event = msg.event;
          if (event) {
            broadcastToRoom(roomSession, JSON.stringify(event));
          }
        } else if (msgType === "gemini_transcript") {
          broadcastToRoom(roomSession, JSON.stringify({ type: msg.direction === "input" ? "input_transcript" : "output_transcript", text: msg.text }));
        } else if (msgType === "gemini_turn") {
          broadcastToRoom(roomSession, JSON.stringify({ type: msg.event }));
        } else if (msgType === "text") {
          // Text now handled in browser directly — just broadcast for display
          broadcastToRoom(roomSession, JSON.stringify({ type: "input_transcript", text: msg.content }));
        } else if (msgType === "midi_snapshot") {
          // MIDI snapshot — browser sends to Gemini directly, server just stores summary
          const summary = describeMidiSnapshot(msg);
          if (summary) {
            roomSession.lastMidiSummary = summary;
          }
        } else if (msgType === "user_speech_transcript") {
          const text = (msg.text as string || "").trim();
          if (text) {
            broadcastToRoom(roomSession, JSON.stringify({ type: "input_transcript", text }));
          }
        } else if (msgType === "set_mode") {
          // Single agent — mode is always storyteller
        } else if (msgType === "start_coaching") {
          statusTracker.coaching.active = true;
          statusTracker.coaching.startedAt = Date.now();
          statusTracker.gemini.connected = true;
          statusTracker.gemini.connectedAt = Date.now();
          statusTracker.gemini.sessionId = sessionId;
          console.log(`[${APP_NAME}] Coaching started for room ${roomCode} (browser-side Gemini)`);
        } else if (msgType === "stop_coaching") {
          statusTracker.coaching.active = false;
          statusTracker.gemini.connected = false;
          statusTracker.gemini.sessionId = null;
          console.log(`[${APP_NAME}] Coaching stopped for room ${roomCode}`);
        } else if (msgType === "midi_event") {
          broadcastToRoom(roomSession, JSON.stringify(msg));
        } else if (msgType === "video_frame" && primaryDevice.roles.camera) {
          // Primary camera — browser sends to Gemini directly, forward to other devices
          const frameMsg = JSON.stringify(msg);
          for (const d of roomSession.devices.values()) {
            if (d.id !== primaryDeviceId && d.ws.readyState === WebSocket.OPEN) {
              try { d.ws.send(frameMsg); } catch {}
            }
          }
        } else if (msgType === "camera_state") {
          roomSession.cameraEnabled = Boolean(msg.enabled);
          broadcastToRoom(roomSession, JSON.stringify({ type: "camera_state", enabled: roomSession.cameraEnabled }));
        } else if (msgType === "session_settings") {
          roomSession.sessionSettings = {
            scale: String(msg.scale || roomSession.sessionSettings.scale),
            bpm: Number(msg.bpm) || roomSession.sessionSettings.bpm,
            timeSignature: String(msg.timeSignature || roomSession.sessionSettings.timeSignature),
          };
          broadcastToRoom(roomSession, JSON.stringify({ type: "session_settings", ...roomSession.sessionSettings }));
        } else if (msgType === "hand_state") {
          roomSession.bothHandsDetected = Boolean(msg.bothHands);
          broadcastToRoom(roomSession, JSON.stringify({ type: "hand_state", hands: msg.hands, bothHands: msg.bothHands }));
        } else if (msgType === "refresh_camera") {
          broadcastToRoom(roomSession, JSON.stringify({ type: "refresh_camera" }));
        } else if (msgType === "set_device_role") {
          const { deviceId, role, enabled } = msg;
          if (role === "mic" || role === "midi" || role === "camera") {
            setDeviceRole(roomSession, deviceId, role, Boolean(enabled));
            console.log(`[${APP_NAME}] Role ${role}=${enabled} on device ${deviceId}`);
          }
        } else if (msgType === "go_live") {
          const wantLive = msg.enabled !== false;
          if (wantLive) {
            liveRoomCode = roomCode;
            console.log(`[${APP_NAME}] Room ${roomCode} is now LIVE`);
            ws.send(JSON.stringify({ type: "live_status", live: true }));
            broadcastSpectators(JSON.stringify({
              type: "spectator_status", connected: true, spectators: spectators.size,
              activeSession: true, room: roomCode,
            }));
            const liveRs = rooms.get(roomCode);
            if (liveRs) {
              broadcastSpectators(JSON.stringify({ type: "session_settings", ...liveRs.sessionSettings }));
            }
          } else {
            if (liveRoomCode === roomCode) {
              liveRoomCode = null;
              console.log(`[${APP_NAME}] Room ${roomCode} stopped live`);
            }
            ws.send(JSON.stringify({ type: "live_status", live: false }));
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
  clearInterval(primaryPingInterval);
  statusTracker.primaryConnectedAt = null;
  statusTracker.coaching.active = false;
  statusTracker.gemini.connected = false;
  statusTracker.gemini.sessionId = null;

  // Cleanup — remove this device from the default room but keep the room alive
  if (roomSession.midiFlushTimer) clearTimeout(roomSession.midiFlushTimer);
  const rs = rooms.get(roomCode);
  if (rs) {
    rs.devices.delete(primaryDeviceId);
    rs.primaryWs = null as any;
    // Don't delete the default room or reset liveRoomCode — room persists
  }
  if (false) { // Never delete default room
    liveRoomCode = null;
    console.log(`[${APP_NAME}] Live room ${roomCode} ended`);
  }
  console.log(`[${APP_NAME}] Primary disconnected: ${sessionId}, room ${roomCode} (room persists)`);
  try { ws.close(); } catch {}
}
