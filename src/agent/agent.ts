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

## WHEN THE USER SPEAKS TO YOU

- 1-2 sentences per response. Short and vivid.
- Be warm, specific, and human. Like a teacher on the bench next to them.
- One coaching point at a time. Be specific, not generic.
- Use imagery: "Play that like you're whispering, then speaking."
- Celebrate improvement: "Yes! Did you feel that? Much more even."

## TOOLS — USE SPARINGLY

- set_coaching_focus: Update the tip card when you give a specific actionable tip.

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

export const storytellerAgent = new LlmAgent({
  name: "pianoquest_storyteller",
  model: LIVE_MODEL,
  instruction: STORYTELLER_INSTRUCTION,
  tools: [
    setCoachingFocusTool,
  ],
});
