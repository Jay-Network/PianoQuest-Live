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
    case "rate_performance": {
      return { status: "ok", ...args };
    }
    case "set_practice_goal": {
      return { status: "ok", ...args };
    }
    case "celebrate_progress": {
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
    case "rate_performance":
      return { type: "performance_rating", score: args.score, category: args.category, feedback: args.feedback };
    case "set_practice_goal":
      return { type: "practice_goal", goal: args.goal, target_metric: args.target_metric, difficulty: args.difficulty };
    case "celebrate_progress":
      return { type: "achievement", achievement: args.achievement, detail: args.detail };
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
        {
          name: "rate_performance",
          description:
            "Rate the player's recent performance on a 0-100 scale for a specific category. " +
            "Call this when the player asks for feedback or after they finish a piece. " +
            "Be specific with MIDI numbers in feedback.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.NUMBER,
                description: "Performance score from 0 to 100.",
              },
              category: {
                type: Type.STRING,
                description: "Category being rated: 'dynamics', 'rhythm', 'technique', or 'overall'.",
              },
              feedback: {
                type: Type.STRING,
                description: "Specific feedback citing MIDI data (velocity ranges, timing, note accuracy).",
              },
            },
            required: ["score", "category", "feedback"],
          },
        },
        {
          name: "set_practice_goal",
          description:
            "Set a specific practice goal for the current session. Call this when the player asks " +
            "what to work on, or when shifting focus to a new skill area. " +
            "Goals should be concrete and achievable within the session.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              goal: {
                type: Type.STRING,
                description: "The practice goal (e.g. 'Play C major scale with velocity between 60-80').",
              },
              target_metric: {
                type: Type.STRING,
                description: "What to measure (e.g. 'velocity evenness', 'tempo consistency').",
              },
              difficulty: {
                type: Type.STRING,
                description: "Difficulty level: 'easy', 'medium', or 'hard'.",
              },
            },
            required: ["goal", "target_metric", "difficulty"],
          },
        },
        {
          name: "celebrate_progress",
          description:
            "Celebrate when the player achieves something noteworthy. Use when you notice " +
            "real improvement or when they accomplish a practice goal. " +
            "Be genuine — only celebrate real progress.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              achievement: {
                type: Type.STRING,
                description: "Short achievement title (e.g. 'Even Dynamics!', 'Perfect Tempo').",
              },
              detail: {
                type: Type.STRING,
                description: "What specifically improved, citing MIDI data if available.",
              },
            },
            required: ["achievement", "detail"],
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
You are PianoQuest, an expert piano coach. You talk naturally like a knowledgeable friend who happens to be a concert pianist and teacher. \
ALWAYS speak in English. Never switch to any other language regardless of what you hear.

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
Visual + MIDI correlation is your superpower. Call report_technique when you have a good EYE+EAR observation.

## RULE #5: USE YOUR TOOLS WHEN ASKED

When the player asks for feedback, use your tools to create visual cards they can reference:

- **set_coaching_focus**: When you give a specific technique tip, update the card so they can see it.
- **report_technique**: When you can correlate camera + MIDI observations.
- **rate_performance**: When they ask "how did I do?" or request a score. Rate dynamics, rhythm, or technique 0-100.
- **set_practice_goal**: When they ask what to work on. Set a concrete goal with difficulty level.
- **celebrate_progress**: When they genuinely improve — velocity evening out, tempo stabilizing, etc.

Tool calls create visible UI cards. Use them when the player requests feedback — they are visual proof of your analysis.

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

const ratePerformanceTool = new FunctionTool({
  name: "rate_performance",
  description: "Rate the player's recent performance on a 0-100 scale for a specific category.",
  parameters: z.object({
    score: z.number().describe("Performance score from 0 to 100."),
    category: z.string().describe("Category: dynamics, rhythm, technique, or overall."),
    feedback: z.string().describe("Specific feedback citing MIDI data."),
  }) as any,
  execute: (input: any) => ({ status: "ok", ...input }),
});

const setPracticeGoalTool = new FunctionTool({
  name: "set_practice_goal",
  description: "Set a specific practice goal for the current session.",
  parameters: z.object({
    goal: z.string().describe("The practice goal."),
    target_metric: z.string().describe("What to measure."),
    difficulty: z.string().describe("Difficulty: easy, medium, or hard."),
  }) as any,
  execute: (input: any) => ({ status: "ok", ...input }),
});

const celebrateProgressTool = new FunctionTool({
  name: "celebrate_progress",
  description: "Celebrate when the player achieves something noteworthy.",
  parameters: z.object({
    achievement: z.string().describe("Short achievement title."),
    detail: z.string().describe("What specifically improved."),
  }) as any,
  execute: (input: any) => ({ status: "ok", ...input }),
});

export const storytellerAgent = new LlmAgent({
  name: "pianoquest_storyteller",
  model: LIVE_MODEL,
  instruction: STORYTELLER_INSTRUCTION,
  tools: [
    setCoachingFocusTool,
    reportTechniqueTool,
    ratePerformanceTool,
    setPracticeGoalTool,
    celebrateProgressTool,
  ],
});
