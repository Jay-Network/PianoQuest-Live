/**
 * PianoQuest Live — agent definition with tools and system instruction.
 *
 * Tools are declared both as ADK FunctionTool (for structure/future runLive)
 * and as raw functionDeclarations for the @google/genai Live API.
 */

import { z } from "zod";
import { LlmAgent, FunctionTool } from "@google/adk";
import { Type } from "@google/genai";

// =========================================================================
// Model
// =========================================================================

export const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

// =========================================================================
// Tool implementations — execute locally, push results to client via WS
// =========================================================================

export function executeToolLocally(
  name: string,
  args: Record<string, unknown>
): Record<string, unknown> {
  switch (name) {
    case "set_coaching_focus": {
      const instruction = args.instruction as string;
      return { status: "ok", instruction };
    }
    case "report_technique": {
      return { status: "ok", ...args };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

/**
 * Map a tool call from Gemini to the WebSocket message(s) for the frontend.
 * Returns the message to send to the client, or null if no UI event.
 */
export function toolCallToVisualEvent(
  name: string,
  args: Record<string, unknown>
): Record<string, unknown> | null {
  switch (name) {
    case "set_coaching_focus":
      return { type: "coaching_focus", text: args.instruction };
    case "report_technique":
      return { type: "technique_report", finger: args.finger, visual_observation: args.visual_observation, audio_observation: args.audio_observation, suggestion: args.suggestion };
    default:
      return null;
  }
}

// =========================================================================
// Gemini Live functionDeclarations (used by @google/genai client.live.connect)
// =========================================================================

export function buildToolDeclarations() {
  return [
    {
      functionDeclarations: [
        {
          name: "set_coaching_focus",
          description:
            "Update the coaching focus card with the current technique tip. " +
            "Call this when you give a specific, actionable instruction the user " +
            "should focus on. Keep it concise (under 120 characters).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              instruction: {
                type: Type.STRING,
                description: "The coaching tip to display.",
              },
            },
            required: ["instruction"],
          },
        },
        {
          name: "report_technique",
          description:
            "Report a visual+audio technique observation when camera is active. " +
            "Use when you can correlate what you see in the video with what you hear.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              finger: {
                type: Type.STRING,
                description: "Which finger or hand area observed (e.g. 'right thumb', 'left pinky', 'both hands').",
              },
              visual_observation: {
                type: Type.STRING,
                description: "What you see in the video frame.",
              },
              audio_observation: {
                type: Type.STRING,
                description: "What you hear in the audio/MIDI that correlates.",
              },
              suggestion: {
                type: Type.STRING,
                description: "Actionable suggestion for improvement.",
              },
            },
            required: ["finger", "visual_observation", "audio_observation", "suggestion"],
          },
        },
      ],
    },
  ];
}

// =========================================================================
// System instruction (verbatim from Python agent.py)
// =========================================================================

export const STORYTELLER_INSTRUCTION = `\
You are PianoQuest, a piano coach sitting right next to the player. You have THREE simultaneous input streams and you must use ALL of them together:

1. VOICE — You hear the player speak through their microphone. They talk to you naturally.
2. MIDI — You receive real-time MIDI data showing exactly which notes are played, at what velocity (loudness), and when. This arrives as periodic text updates like "recent notes: C4@80, E4@72, G4@65" with velocity values (0-127) and timing info.
3. CAMERA — When active, you see the player's hands on the piano keys via video frames. You can observe finger position, hand shape, wrist angle, and technique.

## THE KEY THING: INTEGRATE ALL THREE

Your unique value is correlating these streams. Examples:
- You SEE the wrist tensing up AND the MIDI shows velocity dropping — tell the player their tension is affecting their sound.
- The MIDI shows tempo rushing in bars 5-8 AND you SEE the right hand reaching awkwardly — the fingering might be causing the rush.
- The player SAYS "I think that sounded even" but the MIDI shows velocities ranging from 55 to 95 — gently show them the numbers.
- You SEE flat fingers AND hear thin tone in the audio AND MIDI velocities are low — connect all three observations.

When only some streams are available, use what you have. MIDI alone is extremely valuable. Voice + MIDI is powerful. All three together is the full picture.

## HOW TO BEHAVE

Talk naturally like a real teacher. Say hello when they say hello. Answer questions conversationally. \
When they play, LISTEN and WATCH — then give specific, data-backed feedback. \
Don't force analysis when they just want to chat. But when they play or ask for feedback, be precise and analytical.

## ANALYTICAL FOCUS

When analyzing playing, always ground observations in data:
- TEMPO: Cite timing gaps between notes. "That passage rushed — your IOIs compressed from ~500ms to ~380ms."
- DYNAMICS: Cite velocity numbers. "Left hand averaging 62 while right is at 88 — big imbalance."
- HABITS: Identify patterns they don't notice. "You consistently accent beat 3 — velocities spike 15-20 points every third beat."
- TECHNIQUE (with camera): Connect what you see to what the MIDI shows. "Your pinky is collapsing on those octaves, which is why velocity drops to 45 there."

Be specific. Use numbers. Don't say "that was a bit uneven" — say "velocities ranged from 52 to 91 across those 8 notes."

## KEEP IT NATURAL

- Short responses while they're actively playing (don't interrupt their flow with long speeches)
- Longer detailed analysis when they stop and ask for feedback
- Never ask them to "say a command" — just listen and respond
- If they ask you to listen, watch, and analyze — do it. If they just want to talk about music — do that.
`;

// =========================================================================
// ADK Agent definition (structural — for future runLive support)
// =========================================================================

const setCoachingFocusTool = new FunctionTool({
  name: "set_coaching_focus",
  description: "Update the coaching focus card with the current technique tip.",
  parameters: z.object({
    instruction: z.string().describe("The coaching tip to display."),
  }) as any,
  execute: (input: any) => ({ status: "ok", instruction: input.instruction }),
});

const reportTechniqueTool = new FunctionTool({
  name: "report_technique",
  description: "Report a visual+audio technique observation when camera is active.",
  parameters: z.object({
    finger: z.string().describe("Which finger or hand area observed."),
    visual_observation: z.string().describe("What you see in the video frame."),
    audio_observation: z.string().describe("What you hear in the audio/MIDI."),
    suggestion: z.string().describe("Actionable suggestion for improvement."),
  }) as any,
  execute: (input: any) => {
    return { status: "ok", finger: input.finger, visual_observation: input.visual_observation, audio_observation: input.audio_observation, suggestion: input.suggestion };
  },
});

export const storytellerAgent = new LlmAgent({
  name: "pianoquest_storyteller",
  model: LIVE_MODEL,
  instruction: STORYTELLER_INSTRUCTION,
  tools: [
    setCoachingFocusTool,
    reportTechniqueTool,
  ],
});
