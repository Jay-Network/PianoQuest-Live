/**
 * PianoQuest Live — Express + WebSocket server with @google/genai Live API.
 *
 * ADK TS v0.5 does not have runLive() — we use the @google/genai Live API
 * directly with manual tool execution. The genai Live API is callback-based:
 * we pass an `onmessage` callback to `client.live.connect()`.
 */

import express from "express";
import { createServer } from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import type { IncomingMessage } from "http";
import {
  LIVE_MODEL,
  STORYTELLER_INSTRUCTION,
  buildToolDeclarations,
  executeToolLocally,
  toolCallToVisualEvent,
} from "./agent.js";

const APP_NAME = "pianoquest";
const STATIC_DIR = path.join(__dirname, "..", "..", "static");

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
// Express + WebSocket server
// =========================================================================

export function createApp() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: APP_NAME, modes: ["storyteller"] });
  });

  app.get("/", (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, "index.html"));
  });

  app.use("/static", express.static(STATIC_DIR));

  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    if (url.pathname === "/ws/dialog") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    handleWebSocket(ws);
  });

  return server;
}

// =========================================================================
// WebSocket handler — Gemini Live session (callback-based API)
// =========================================================================

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  require("crypto").randomFillSync(arr);
  return Buffer.from(arr).toString("hex");
}

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

async function handleWebSocket(ws: WebSocket) {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    ws.send(JSON.stringify({ type: "error", message: "No API key configured" }));
    ws.close();
    return;
  }

  process.env.GOOGLE_API_KEY = apiKey;

  const client = new GoogleGenAI({ apiKey });
  const sessionId = randomHex(4);
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

  console.log(`[${APP_NAME}] Client connected: ${sessionId}`);

  const liveConfig: Record<string, unknown> = {
    response_modalities: ["AUDIO"],
    system_instruction: STORYTELLER_INSTRUCTION,
    speech_config: {
      voice_config: {
        prebuilt_voice_config: { voice_name: "Puck" },
      },
    },
    input_audio_transcription: {},
    output_audio_transcription: {},
    realtime_input_config: {
      automatic_activity_detection: {
        disabled: false,
        silence_duration_ms: 1000,
      },
    },
    tools: buildToolDeclarations(),
  };

  try {
    const session = await client.live.connect({
      model: LIVE_MODEL,
      config: liveConfig as any,
      callbacks: {
        onopen: () => {
          console.log(`[${APP_NAME}] Gemini Live session opened: ${sessionId}`);
        },
        onmessage: (msg: any) => {
          if (closed) return;

          try {
            // Audio data from model turn
            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const audioBuffer = Buffer.from(part.inlineData.data, "base64");
                  if (turnHasUserSpeech) {
                    ws.send(audioBuffer, { binary: true });
                  } else {
                    pendingAudioChunks.push(audioBuffer);
                  }
                }
                if (part.text) {
                  const text = part.text.trim();
                  if (text) {
                    bufOutput = text;
                  }
                }
              }
            }

            // Input transcription (user speech)
            if (msg.serverContent?.inputTranscription?.text) {
              const text = msg.serverContent.inputTranscription.text.trim();
              if (text) {
                bufInput = text;
                turnHasUserSpeech = true;
                // Flush pending audio now that we know user spoke
                while (pendingAudioChunks.length > 0) {
                  ws.send(pendingAudioChunks.shift()!, { binary: true });
                }
              }
            }

            // Output transcription
            if (msg.serverContent?.outputTranscription?.text) {
              const text = msg.serverContent.outputTranscription.text.trim();
              if (text) {
                bufOutput = text;
              }
            }

            // Tool calls from Gemini
            if (msg.toolCall?.functionCalls) {
              for (const fc of msg.toolCall.functionCalls) {
                const args = (fc.args ?? {}) as Record<string, unknown>;

                // Send visual event to frontend
                const visualEvent = toolCallToVisualEvent(fc.name!, args);
                if (visualEvent) {
                  ws.send(JSON.stringify(visualEvent));
                }

                // Send tool_call notification to frontend
                ws.send(
                  JSON.stringify({
                    type: "tool_call",
                    name: fc.name,
                    args,
                  })
                );

                // Execute tool locally
                const result = executeToolLocally(fc.name!, args);

                // Send tool_result to frontend
                ws.send(
                  JSON.stringify({
                    type: "tool_result",
                    name: fc.name,
                    result,
                  })
                );

                // Send function response back to Gemini
                session.sendToolResponse({
                  functionResponses: [
                    {
                      name: fc.name!,
                      response: result,
                      id: fc.id,
                    },
                  ],
                });
              }
            }

            // Turn complete
            if (msg.serverContent?.turnComplete) {
              if (turnHasUserSpeech && bufInput) {
                ws.send(
                  JSON.stringify({ type: "input_transcript", text: bufInput })
                );
                bufInput = "";
              }
              if (turnHasUserSpeech && bufOutput) {
                ws.send(
                  JSON.stringify({ type: "output_transcript", text: bufOutput })
                );
                bufOutput = "";
              }
              pendingAudioChunks.length = 0;
              if (turnHasUserSpeech) {
                ws.send(JSON.stringify({ type: "turn_complete" }));
              }
              turnHasUserSpeech = false;
            }

            // Interrupted
            if (msg.serverContent?.interrupted) {
              if (turnHasUserSpeech && bufInput) {
                ws.send(
                  JSON.stringify({ type: "input_transcript", text: bufInput })
                );
                bufInput = "";
              }
              if (turnHasUserSpeech && bufOutput) {
                ws.send(
                  JSON.stringify({ type: "output_transcript", text: bufOutput })
                );
                bufOutput = "";
              }
              pendingAudioChunks.length = 0;
              if (turnHasUserSpeech) {
                ws.send(JSON.stringify({ type: "interrupted" }));
              }
              turnHasUserSpeech = false;
            }
          } catch (e: any) {
            if (!closed) {
              console.log(`[${APP_NAME}] onmessage error:`, e?.message);
            }
          }
        },
        onerror: (e: any) => {
          if (!closed) {
            console.log(`[${APP_NAME}] Gemini Live error:`, e?.message ?? e);
          }
        },
        onclose: () => {
          console.log(`[${APP_NAME}] Gemini Live session closed: ${sessionId}`);
          closed = true;
          try { ws.close(); } catch {}
        },
      },
    });

    // ---------------------------------------------------------------
    // Receive from browser client, forward to Gemini
    // ---------------------------------------------------------------
    try {
      for await (const rawMsg of wsMessages(ws)) {
        if (closed) break;

        // Binary = PCM audio at 16kHz
        if (rawMsg instanceof Buffer || rawMsg instanceof ArrayBuffer) {
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
            const frameBytes = Buffer.from(msg.data, "base64");
            session.sendRealtimeInput({
              media: {
                data: frameBytes.toString("base64"),
                mimeType: "image/jpeg",
              },
            });
          } else if (msgType === "text") {
            session.sendClientContent({
              turns: {
                role: "user",
                parts: [{ text: msg.content }],
              },
              turnComplete: true,
            });
          } else if (msgType === "midi_snapshot") {
            const summary = describeMidiSnapshot(
              msg,
              cameraEnabled,
              bothHandsDetected,
              detectedHandCount
            );
            if (summary) {
              session.sendClientContent({
                turns: {
                  role: "user",
                  parts: [{ text: summary }],
                },
                turnComplete: true,
              });
            }
          } else if (msgType === "set_mode") {
            // Single agent — mode is always storyteller
          } else if (msgType === "camera_state") {
            cameraEnabled = Boolean(msg.enabled);
            if (!cameraEnabled) {
              bothHandsDetected = false;
              detectedHandCount = 0;
            }
          } else if (msgType === "hand_state") {
            detectedHandCount = parseInt(msg.detected_count ?? "0", 10);
            bothHandsDetected = Boolean(msg.both_hands_detected);
          } else if (msgType === "midi_event") {
            // Frontend uses raw MIDI events for UI rendering; snapshots go to agent
          } else if (msgType === "close") {
            break;
          }
        }
      }
    } catch (e: any) {
      if (!closed) console.log(`[${APP_NAME}] receive error:`, e?.message);
    }

    closed = true;
  } catch (e: any) {
    console.error(`[${APP_NAME}] WebSocket error:`, e);
    try {
      ws.send(JSON.stringify({ type: "error", message: String(e) }));
    } catch {}
  } finally {
    console.log(`[${APP_NAME}] Client disconnected: ${sessionId}`);
    try {
      ws.close();
    } catch {}
  }
}
