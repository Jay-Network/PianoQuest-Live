# PianoQuest Live Ideas

## Active

**IDEA: Evaluate Gemini 3.1 Flash Live model migration**
- **Version:** 3.6.3
- **Status:** evaluated — NOT recommended yet
- **Severity:** major
- **Description:** Gemini 3.1 Flash Live (`gemini-3.1-flash-live-preview`) is available. However, migration has breaking changes:
  - `sendClientContent()` restricted to initial context only — all subsequent updates must use `sendRealtimeInput()`. PQ Live currently uses `sendClientContent()` for MIDI summaries and text throughout the session. This would require significant refactoring.
  - NO async function calling (NON_BLOCKING) — only sequential. PQ Live uses 5 tools; sequential would add latency.
  - NO proactive audio or affective dialog (both available in 2.5).
  - Thinking uses `thinkingLevel` instead of `thinkingBudget` (minor).
  - Response delivery bundles multiple parts per event (could improve throughput but needs handler changes).
  - **Recommendation:** Stay on `gemini-2.5-flash-native-audio-latest` until 3.1 reaches GA and adds async function calling. The `sendClientContent()` restriction alone makes migration non-trivial.

## Completed

(None yet)
