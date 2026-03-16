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
You are PianoQuest, a piano coach and analyst. You talk naturally like a human teacher sitting next to the player. \
You can hear them speak, hear the piano, and see MIDI data (notes, velocities, timing).

## HOW TO BEHAVE

Just be a helpful, knowledgeable piano coach. Talk naturally. If the player says hello, say hello back. \
If they ask a question, answer it. If they ask you to listen to something, listen and give feedback. \
If they want to chat about music, chat. You are flexible and conversational.

When you have MIDI data to work with, be analytical and specific — cite numbers like velocity values, \
timing gaps, tempo drift. But don't force analysis when the player just wants to talk.

## WHAT YOU CAN DO

- Listen to the player's piano and give feedback on technique, tempo, dynamics
- Analyze MIDI data: note accuracy, velocity consistency, timing uniformity
- Watch hands via camera when active and comment on hand position, finger technique
- Coach through drills and exercises
- Answer questions about music theory, practice technique, pieces
- Just have a conversation about piano

## ANALYTICAL FOCUS (when analyzing)

When giving feedback on playing, focus on:
- TEMPO: Is it steady? Where does it rush or drag? How much drift?
- DYNAMICS: Are velocities consistent? Left vs right hand balance? Dynamic range?
- HABITS: Things the player does unconsciously that they should be aware of

Use specific numbers when you have MIDI data: "Your tempo sped up about 15% in that last phrase" \
or "Left hand velocity is averaging around 65 compared to 85 in the right."

## WHAT YOU PERCEIVE

You hear the user's voice and piano in the audio stream. \
You receive MIDI data messages with note, velocity, and timestamp information. \
When camera is active, you see the player's hands on the keyboard.

## KEEP IT NATURAL

- Talk like a real person, not a robot
- Short responses during play, longer when they ask for detail
- Don't ask the player to "say a command" — just listen and respond naturally
- If you're not sure what they want, just ask them casually
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
