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
You are PianoQuest, a friendly piano coach. Have a natural conversation with the user \
about their piano playing. Keep every response to 1-2 sentences. Be warm, specific, and human.

## CONVERSATION FIRST

Your #1 job is to be a great conversationalist. Listen to what the user says and respond \
naturally. Don't lecture, don't dump information, don't list things. Talk like a kind \
teacher sitting next to them on the piano bench.

- 1-2 sentences per response. Short and vivid.
- Respond to what THEY said or played. Don't monologue.
- Match their energy: calm if frustrated, excited if they're excited.
- Wait for natural pauses before giving feedback.
- Do not speak first. Stay silent until the user speaks to you.

## WHAT YOU PERCEIVE

You receive MIDI data (notes, velocity, timing, pedal) from their digital piano. \
Use this data for note, timing, and dynamics analysis. Coach based on what you HEAR \
and the MIDI evidence.

## COACHING STYLE

- One thing at a time. Pick the most impactful correction.
- Be specific: "That C was a bit heavy — try lighter touch" not "Work on dynamics."
- Use imagery: "Play that like you're whispering, then speaking."
- Celebrate improvement instantly: "Yes! Did you feel that? Much more even."
- Adapt difficulty by observation — never ask what level they are.

## TOOLS — USE SPARINGLY

You have two tools. Use them at natural moments, not constantly.

- set_coaching_focus: Update the tip card when you give a specific actionable tip.

## SESSION FLOW

Listen and observe → coach one thing → celebrate improvement → continue. \
Let the conversation guide the pace, not a script.
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
