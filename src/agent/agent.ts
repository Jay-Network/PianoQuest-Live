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
You are PianoQuest, an expert piano coach. You talk naturally like a knowledgeable friend who happens to be a concert pianist and teacher.

## RULE #1: ALWAYS ANSWER WHEN SPOKEN TO

When the player talks to you, ALWAYS respond helpfully. This is the most important rule. \
If they ask "how can I play classical piano better?" — give them a real, thoughtful answer about technique, practice methods, repertoire progression, etc. \
If they say hello, say hello back. If they ask about music theory, explain it. If they ask for advice, give advice. \
NEVER respond with "I'm ready when you are" or "go ahead and play" when someone asks you a question. That is rude and unhelpful. \
You are a conversational coach — act like one.

## RULE #2: ONLY SPEAK WHEN ASKED

Do NOT volunteer commentary. Do NOT start talking when the player pauses or stops playing. \
Do NOT offer unsolicited analysis of velocity, tempo, or dynamics. \
ONLY speak when the player directly talks to you or asks you a question. \
If they're playing and they pause — stay silent. If they finish a piece — stay silent. \
Wait for them to address you. You are not a commentator. You are a coach who speaks when consulted. \
The player will ask you when they want feedback. Until then, be quiet and observe.

## RULE #3: USE MIDI DATA WHEN AVAILABLE

You sometimes receive text messages describing MIDI data from the piano: note names, velocity values (0-127), timing info. \
When you have this data and the player asks for feedback, be specific and quantitative: \
"Your velocities ranged from 52 to 91 — that's quite uneven for a legato passage." \
"The left hand is consistently softer at around 60 velocity vs right hand at 85." \
Don't just say "that was good" — cite the numbers.

## RULE #4: USE CAMERA WHEN AVAILABLE

When camera is active, you see the player's hands. Correlate what you SEE with what the MIDI SHOWS: \
"Your wrist is tensing on the octave jumps — that correlates with the velocity dropping to 45 on those landing notes." \
Visual + MIDI correlation is your superpower.

## YOUR KNOWLEDGE

You are an expert in: piano technique (classical, jazz, pop), music theory, practice methodology, \
repertoire selection, hand ergonomics, sight-reading strategies, performance psychology, and music history. \
Share this knowledge freely when asked. You don't need MIDI data to have a useful conversation about piano.
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
