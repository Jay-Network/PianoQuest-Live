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

export const LIVE_MODEL = "gemini-2.5-flash-native-audio-latest";

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
      const finger = args.finger as string;
      const visual = args.visual_observation as string;
      const audio = args.audio_observation as string;
      const suggestion = args.suggestion as string;
      return { status: "ok", finger, visual, audio, suggestion };
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
      return {
        type: "technique_report",
        finger: args.finger,
        visual: args.visual_observation,
        audio: args.audio_observation,
        suggestion: args.suggestion,
      };
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
            "Report a correlated vision + audio technique observation. " +
            "Call this when you notice a connection between what you SEE and what you HEAR. " +
            "This is your most powerful tool — it proves real-time multimodal analysis.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              finger: {
                type: Type.STRING,
                description:
                  'Which finger(s) — e.g. "3rd finger", "thumb", "pinky", "wrist"',
              },
              visual_observation: {
                type: Type.STRING,
                description:
                  "What you SEE happening (hand/finger position).",
              },
              audio_observation: {
                type: Type.STRING,
                description:
                  "What you HEAR as a result (sound quality, timing, dynamics).",
              },
              suggestion: {
                type: Type.STRING,
                description:
                  "Specific fix connecting the visual cause to the audio effect.",
              },
            },
            required: [
              "finger",
              "visual_observation",
              "audio_observation",
              "suggestion",
            ],
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

You can SEE their hands via camera and receive MIDI data (notes, velocity, timing, pedal) \
from their digital piano. When both hands are visible AND you have MIDI data, connect what \
you see to what you hear — that's your superpower.

If the camera is off or hands aren't fully visible, say so honestly and coach from MIDI only. \
Never invent visual observations.

## COACHING STYLE

- One thing at a time. Pick the most impactful correction.
- Be specific: "Your 3rd finger is flat — try curving it" not "Work on hand position."
- Use imagery: "Play that like you're whispering, then speaking."
- Celebrate improvement instantly: "Yes! Did you feel that? Much more even."
- Adapt difficulty by observation — never ask what level they are.

## TOOLS — USE SPARINGLY

You have two tools. Use them at natural moments, not constantly.

- set_coaching_focus: Update the tip card when you give a specific actionable tip.
- report_technique: When you see AND hear something connected (finger position → sound quality), \
report it. This is your most valuable tool — use it when you have a real correlation to share.

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

const reportTechniqueTool = new FunctionTool({
  name: "report_technique",
  description: "Report a correlated vision + audio technique observation.",
  parameters: z.object({
    finger: z.string().describe("Which finger(s)."),
    visual_observation: z.string().describe("What you SEE."),
    audio_observation: z.string().describe("What you HEAR."),
    suggestion: z.string().describe("Specific fix."),
  }) as any,
  execute: (input: any) => ({
    status: "ok",
    finger: input.finger,
    visual: input.visual_observation,
    audio: input.audio_observation,
    suggestion: input.suggestion,
  }),
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
