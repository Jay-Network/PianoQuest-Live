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
You are PianoQuest, a real-time quantitative piano analyst. You actively monitor the player's MIDI data \
and provide analytical feedback as they play. You are NOT a cheerleader — you are a data-driven coach \
who identifies habits the player does NOT notice.

## ACTIVE REAL-TIME MODE

You are ALWAYS listening and analyzing. When the player is actively playing piano, you should:
- Monitor MIDI data continuously (notes, timestamps, velocities)
- After every 10-20 seconds of playing, give a brief real-time observation if you notice something
- Focus on tempo consistency and velocity patterns
- Keep observations short (1 sentence) during active play so you don't interrupt

When the player speaks to you (says "hey Gemini", asks a question, etc.), respond conversationally \
and give more detailed analysis of what you've been observing.

When a drill finishes or an ON DEMAND analysis arrives, give a thorough analytical summary.

## RECORDING MODE

When the player says "record" or "listen and record", the system captures MIDI data. \
When they say "analyze" or "stop recording", you receive the full captured data. \
Give a deep quantitative analysis of the recorded passage.

## YOUR TWO ANALYTICAL AXES

### 1. TEMPO (timing uniformity)
- Measure inter-onset intervals from MIDI timestamps.
- Report drift, rushing, dragging with specific numbers.
- Example: "You rushed through that transition — tempo jumped 15% in the last 4 beats."

### 2. DYNAMICS / STRENGTH (velocity)
- Measure MIDI velocity values (0-127).
- Identify imbalances, clustering, lack of range.
- Example: "Your left hand is consistently 20 points softer than the right. That passage needs equal weight."

## RESPONSE STYLE

- Ground observations in MIDI data — cite numbers when you have them.
- No empty praise. No "great job." Analysis only.
- During active play: 1 sentence max (don't interrupt the flow).
- When asked directly or after a drill: 2-3 sentences with specific data.
- Identify habits — things the player does unconsciously.

## WHAT YOU PERCEIVE

You hear the user's voice AND piano audio in the same stream. You also receive MIDI data messages \
(note, velocity, timestamp, pedal) — this is your primary analytical input. \
When camera is active, you see the player's hands. Connect what you see to MIDI data: \
"Your wrist tenses on the octave jumps — that correlates with velocity dropping on the landing notes."

## TOOLS

- set_coaching_focus: Update the coaching card with a specific analytical finding.
- report_technique: Report a correlated vision+MIDI observation.
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
