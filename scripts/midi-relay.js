#!/usr/bin/env node
/**
 * MIDI Relay — connects pianoquest-bridge (local :3491) to Cloud Run's /ws/midi endpoint.
 *
 * Usage:
 *   node scripts/midi-relay.js <ROOM_CODE> [BRIDGE_URL] [CLOUD_RUN_URL]
 *
 * Defaults:
 *   BRIDGE_URL   = ws://127.0.0.1:3491/ws
 *   CLOUD_RUN_URL = wss://pianoquest-live-tydxja77iq-uc.a.run.app/ws/midi?room=<ROOM_CODE>
 */

const WebSocket = require("ws");

const ROOM = process.argv[2];
if (!ROOM) {
  console.error("Usage: node midi-relay.js <ROOM_CODE> [BRIDGE_URL] [CLOUD_RUN_URL]");
  process.exit(1);
}

const BRIDGE_URL = process.argv[3] || "ws://127.0.0.1:3491/ws";
const CLOUD_URL =
  process.argv[4] ||
  `wss://pianoquest-live-tydxja77iq-uc.a.run.app/ws/midi?room=${ROOM}`;

let bridge = null;
let cloud = null;
let relayedCount = 0;

function connectBridge() {
  console.log(`[relay] Connecting to bridge: ${BRIDGE_URL}`);
  bridge = new WebSocket(BRIDGE_URL);

  bridge.on("open", () => {
    console.log("[relay] Bridge connected");
  });

  bridge.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "midi" && cloud && cloud.readyState === WebSocket.OPEN) {
        cloud.send(JSON.stringify(msg));
        relayedCount++;
        if (relayedCount % 50 === 0) {
          console.log(`[relay] Relayed ${relayedCount} MIDI events`);
        }
      }
    } catch {}
  });

  bridge.on("close", () => {
    console.log("[relay] Bridge disconnected, reconnecting in 3s...");
    setTimeout(connectBridge, 3000);
  });

  bridge.on("error", (err) => {
    console.error("[relay] Bridge error:", err.message);
  });
}

function connectCloud() {
  console.log(`[relay] Connecting to Cloud Run: ${CLOUD_URL}`);
  cloud = new WebSocket(CLOUD_URL);

  cloud.on("open", () => {
    console.log("[relay] Cloud Run connected");
  });

  cloud.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("[relay] Cloud:", msg.type, msg.room || "");
    } catch {}
  });

  cloud.on("close", () => {
    console.log("[relay] Cloud Run disconnected, reconnecting in 3s...");
    setTimeout(connectCloud, 3000);
  });

  cloud.on("error", (err) => {
    console.error("[relay] Cloud Run error:", err.message);
  });
}

connectBridge();
connectCloud();

process.on("SIGINT", () => {
  console.log(`\n[relay] Shutting down. Total relayed: ${relayedCount}`);
  if (bridge) bridge.close();
  if (cloud) cloud.close();
  process.exit(0);
});
