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

export const LIVE_MODEL = "gemini-2.5-flash-preview-native-audio-dialog";

// =========================================================================
// Tool implementations — execute locally, push results to client via WS
// =========================================================================

export function executeToolLocally(
  name: string,
  args: Record<string, unknown>
): Record<string, unknown> {
  switch (name) {
    case "set_scene": {
      const sceneId = args.scene_id as string;
      return { status: "ok", scene: sceneId };
    }
    case "award_badge": {
      const badgeId = args.badge_id as string;
      return { status: "ok", badge: badgeId };
    }
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
    case "advance_quest": {
      const phase = args.phase as number;
      return { status: "ok", phase };
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
    case "set_scene":
      return { type: "story_scene", scene_id: args.scene_id };
    case "award_badge":
      return { type: "achievement", badge_id: args.badge_id };
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
    case "advance_quest":
      return { type: "quest_advance", phase: args.phase };
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
          name: "set_scene",
          description:
            "Change the visual story scene displayed to the user. " +
            "Call this when the narrative shifts to a new environment. " +
            "Valid scene_id values: enchanted_forest, harmony_garden, rhythm_dragon, " +
            "crystal_cave, technique_tower, shadow_passage, sunrise_peak, victory_hall",
          parameters: {
            type: Type.OBJECT,
            properties: {
              scene_id: {
                type: Type.STRING,
                description: "The scene identifier to display.",
              },
            },
            required: ["scene_id"],
          },
        },
        {
          name: "award_badge",
          description:
            "Award an achievement badge to the user for genuine improvement. " +
            "Only call this when you can hear or see real progress. Each badge can " +
            "only be awarded once per session. " +
            "Valid badge_id values: even_triad, steady_pulse, singing_legato, " +
            "dragon_slayer, technique_master, chapter_complete, first_note",
          parameters: {
            type: Type.OBJECT,
            properties: {
              badge_id: {
                type: Type.STRING,
                description: "The badge identifier to award.",
              },
            },
            required: ["badge_id"],
          },
        },
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
        {
          name: "advance_quest",
          description:
            "Advance the quest journey map to the next phase. " +
            "Phases: 0=Opening, 1=Assessment, 2=Challenge, 3=Mastery, 4=Celebration. " +
            "Only advance forward — never go backwards.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              phase: {
                type: Type.NUMBER,
                description: "The phase number (0-4).",
              },
            },
            required: ["phase"],
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

You have tools to enhance the visual experience. Use them at natural moments, not constantly.

- set_scene: Change the visual backdrop when the mood shifts. Scenes: enchanted_forest, \
harmony_garden, rhythm_dragon, crystal_cave, technique_tower, shadow_passage, sunrise_peak, \
victory_hall.
- award_badge: Reward genuine improvement. Only when earned. Badges: first_note, even_triad, \
steady_pulse, singing_legato, dragon_slayer, technique_master, chapter_complete.
- set_coaching_focus: Update the tip card when you give a specific actionable tip.
- advance_quest: Move the journey forward (0=Opening, 1=Assessment, 2=Challenge, 3=Mastery, \
4=Celebration). Advance naturally as the session progresses.
- report_technique: When you see AND hear something connected (finger position → sound quality), \
report it. This is your most valuable tool — use it when you have a real correlation to share.

## SESSION ARC

Opening → listen and observe → coach one thing → celebrate improvement → wrap up. \
Let the conversation guide the pace, not a script.
`;

// =========================================================================
// ADK Agent definition (structural — for future runLive support)
// =========================================================================

const setSceneTool = new FunctionTool({
  name: "set_scene",
  description: "Change the visual story scene displayed to the user.",
  parameters: z.object({
    scene_id: z.string().describe("The scene identifier to display."),
  }) as any,
  execute: (input: any) => ({ status: "ok", scene: input.scene_id }),
});

const awardBadgeTool = new FunctionTool({
  name: "award_badge",
  description: "Award an achievement badge to the user.",
  parameters: z.object({
    badge_id: z.string().describe("The badge identifier to award."),
  }) as any,
  execute: (input: any) => ({ status: "ok", badge: input.badge_id }),
});

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

const advanceQuestTool = new FunctionTool({
  name: "advance_quest",
  description: "Advance the quest journey map to the next phase (0-4).",
  parameters: z.object({
    phase: z.number().describe("The phase number (0-4)."),
  }) as any,
  execute: (input: any) => ({ status: "ok", phase: input.phase }),
});

export const storytellerAgent = new LlmAgent({
  name: "pianoquest_storyteller",
  model: LIVE_MODEL,
  instruction: STORYTELLER_INSTRUCTION,
  tools: [
    setSceneTool,
    awardBadgeTool,
    setCoachingFocusTool,
    reportTechniqueTool,
    advanceQuestTool,
  ],
});
