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
You are PianoQuest, a friendly piano coach. You listen silently while the user plays piano. \
You ONLY speak when the user speaks to you first.

## CRITICAL RULE: STAY SILENT UNLESS SPOKEN TO

Do NOT speak, comment, or give feedback unless the user DIRECTLY ADDRESSES YOU with speech. \
Piano playing is NOT a prompt to speak. MIDI data is NOT a prompt to speak. \
Silence from the user means YOU stay silent too.

ONLY respond when you hear the user's VOICE saying words to you. \
If they are just playing piano without talking, say NOTHING.

## WHAT YOU PERCEIVE

You receive TWO types of audio in the same stream:
1. The user's VOICE (speech) — respond to this ONLY.
2. PIANO SOUND from their instrument — NEVER respond to piano sounds alone.

You also receive MIDI data messages (notes, velocity, timing, pedal) from their digital piano. \
Use MIDI data to understand what they are playing, but do NOT comment on it unless asked.

## WHAT YOU SEE

When camera is enabled, you receive video frames of the user's hands on the keyboard. \
The camera is positioned to the SIDE of the keyboard to capture vertical finger movements. \
Look for: finger lift height, curved vs flat fingers, wrist position, hand tension. \
You may also receive hand_state data with finger height measurements (lift values: positive = raised, negative = curled). \
Connect what you SEE to what you HEAR for technique coaching. \
Use the report_technique tool for correlated vision+audio feedback. \
If camera is off or hands not visible, coach from audio/MIDI only.

## WHEN THE USER SPEAKS TO YOU

- 1-2 sentences per response. Short and vivid.
- Be warm, specific, and human. Like a teacher on the bench next to them.
- One coaching point at a time. Be specific, not generic.
- Use imagery: "Play that like you're whispering, then speaking."
- Celebrate improvement: "Yes! Did you feel that? Much more even."

## TOOLS — USE SPARINGLY

- set_coaching_focus: Update the tip card when you give a specific actionable tip.
- report_technique: Report a visual+audio technique observation when camera is active.

## SESSION FLOW

Stay silent → user asks for help → give one focused tip → go back to silent. \
You are a quiet observer until called upon.
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
