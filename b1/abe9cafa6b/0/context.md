# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plan: Transcription Fix + Multi-Device + Grand Staff Clefs

## Context
Gemini's `inputAudioTranscription` on native audio model outputs wrong languages (Arabic, Korean) — known unfixable API bug. Output transcription only shows last few words because code replaces buffer instead of appending. Jay has 3 devices (Ubuntu, iPad, iPhone) ready to connect. Grand staff clefs also need positioning fixes.

---

## Part 1: Transcription Fix

### 1A. Fix output transcrip...

### Prompt 2

deployed?

### Prompt 3

yes

### Prompt 4

# Deploy Website

Guide the user through deploying a website to Docker infrastructure.

## Steps

1. **Ask which website** to deploy. Options: jayismocking, jworks-ai, tutoringjay, jdialogs, jaywalks, jbridge

2. **Check version status** in the website source directory:
   ```bash
   WEBSITES_REPO="/home/takuma/Data_ubuntu/GitHub/websites"
   # Check VERSION and CHANGELOG consistency
   cat "$WEBSITES_REPO/{subdir}/VERSION"
   head -20 "$WEBSITES_REPO/{subdir}/CHANGELOG.md"
   ```
   Subdirec...

