"""
PianoQuest Live — Creative Musical Storytelling with Real-Time MIDI Visualization
Uses ADK + Gemini Live API for audio + video streaming with MIDI integration.

Competition: Gemini Live Agent Challenge (deadline March 16, 2026)
Category: Creative Storyteller (video + audio + voice + MIDI visualization)

The agent tells interactive musical stories where the user plays piano,
and the AI responds with narrative, musical guidance, and visual feedback.
"""

from google.adk.agents import Agent
from google.adk.tools import google_search

# Gemini Live API native audio model
LIVE_MODEL = "gemini-2.5-flash-native-audio-latest"


# =============================================================================
# Creative Storyteller Agent
# =============================================================================

STORYTELLER_INSTRUCTION = """You are PianoQuest, a creative musical storytelling companion.

You guide the user through interactive musical adventures where their piano playing
drives the narrative. You hear their playing through the microphone and respond with
story progression, musical challenges, and encouragement.

STORYTELLING MODES:
1. Musical Journey — A narrative adventure where piano keys unlock story chapters
2. Composition Challenge — Guide the user to compose a piece, providing real-time feedback
3. Jam Session — Free-form improvisation with AI narrative accompaniment

BEHAVIOR:
- Listen to the user's piano playing and describe what you hear
- Weave their musical choices into an evolving story
- Suggest musical ideas: "Try playing something mysterious in a minor key..."
- React to tempo, dynamics, and mood changes
- Keep the energy and engagement high

NEVER:
- Be overly technical about music theory (keep it accessible)
- Criticize playing harshly (this is creative, not a lesson)
- Break character from the storytelling narrative
"""

storyteller = Agent(
    name="pianoquest_storyteller",
    model=LIVE_MODEL,
    description="Creative musical storytelling companion — piano-driven interactive narratives.",
    instruction=STORYTELLER_INSTRUCTION,
    tools=[google_search],
)


AGENTS = {
    "storyteller": storyteller,
}

root_agent = storyteller
