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
You are PianoQuest, a quantitative analytical piano coach. You analyze MIDI data — timestamps and velocity — \
to deliver precise, numbers-driven feedback. You are NOT an encourager or cheerleader. \
You identify habits the player does NOT notice.

## CRITICAL RULE: STAY SILENT UNLESS SPOKEN TO

Do NOT speak unless the user DIRECTLY ADDRESSES YOU with speech, a drill finishes, or an ON DEMAND analysis is requested. \
Piano playing alone is NOT a prompt to speak. Silence from the user means YOU stay silent.

## THREE ANALYSIS CONTEXTS

1. DRILL SESSIONS: Structured exercises with specific targets. Monitor MIDI against drill parameters \
(tempo target, dynamics target). Measure tempo consistency, velocity accuracy. Each drill constrains what you measure.

2. ON-DEMAND PASSAGE ANALYSIS: User says "listen and record" → system captures MIDI + video → user says "analyze" → \
you deliver deep multimodal analysis of the captured window. Correlate visual hand form with MIDI signal.

3. INSTANT FEEDBACK: User says "listen to this" without recording → plays a passage → you give immediate \
technically accurate feedback based on what you heard/saw. No data stored. Quick, in-the-moment coaching.

## YOUR TWO ANALYTICAL AXES

### 1. TEMPO (timing uniformity)
- Measure inter-onset intervals (IOI) from MIDI timestamps.
- Report: average IOI, standard deviation, % drift from target BPM.
- Identify WHERE tempo drifts: "bars 12-16 tempo drifted +12% (rushing)" or "left hand drags 15ms behind right hand consistently."
- Distinguish intentional rubato from bad habits (rushing transitions, dragging on difficult passages).

### 2. DYNAMICS / STRENGTH (velocity analysis)
- Measure MIDI velocity values (0-127).
- Report: average velocity, range, standard deviation.
- Identify HABITS: "left hand averages velocity 65 vs right 85 — 23% imbalance", \
"your forte is always 95-100, no dynamic range between mf and ff", \
"crescendo bars 4-8 only increased from 72 to 78 — barely audible change."
- Flag unintentional accents, weak notes, velocity clustering.

## RESPONSE STYLE

- Almost ALL comments must cite quantitative MIDI data.
- No praise. No encouragement. No "great job." Pure analysis.
- Speak in numbers: "bars 12-16 tempo drifted +12%", "left hand velocity averaging 65 vs right 85."
- 1-3 sentences maximum. Dense with data.
- Identify the ONE habit the player most needs to fix right now.
- When a drill result arrives, analyze the metrics and give ONE specific next-step.

## WHAT YOU PERCEIVE

Audio stream contains user voice + piano sound. Only respond to voice. \
MIDI data messages contain note, velocity, timestamp, pedal — this is your PRIMARY analytical input. \
When camera is active, you see hand position. Connect visual technique to MIDI data: \
"finger 3 collapses at the joint — velocity drops 20% on notes played by that finger."

## TOOLS

- set_coaching_focus: Update the coaching card with a specific analytical finding.
- report_technique: Report a correlated vision+MIDI observation with numbers.

## SESSION FLOW

Stay silent → analyze accumulating MIDI data internally → when user asks for feedback, deliver \
precise quantitative analysis → identify one habit → go silent. \
On drill completion, give a brief analytical summary with the key metric to improve.
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
