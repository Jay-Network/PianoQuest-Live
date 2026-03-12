# PianoQuest Live — 3-Day Competition Plan

**Current version:** 0.4.6
**Deadline:** March 16, 2026 5:00 PM PDT (March 16 8:00 PM EDT)
**Category:** Creative Storyteller ($10K + potential $25K Grand Prize)
**Judging:** Innovation & Multimodal UX 40% | Technical 30% | Demo 30%

---

## Status Assessment (March 12)

### What's Done
- [x] Core app: Gemini 2.5 Flash Live API + ADK + FastAPI + WebSocket
- [x] 3 multimodal inputs: Camera (vision) + MIDI (digital piano) + Voice (speech mic)
- [x] 5 ADK tool calls: set_scene, award_badge, set_coaching_focus, advance_quest, report_technique
- [x] MediaPipe hand tracking with skeleton overlay + both-hands gating
- [x] MIDI input: Web MIDI API with piano roll, keyboard, dynamics bars
- [x] Technique score (0-100) with trend arrows
- [x] 8 story scenes, 7 achievements, quest journey map
- [x] Finger Tracking panel (EYE + EAR structured observations)
- [x] Deployed on Cloud Run (pianoquest-live-tydxja77iq-uc.a.run.app)
- [x] cloudbuild.yaml CI/CD (+0.2 bonus)
- [x] Blog post (+0.6 bonus)
- [x] Devpost description written
- [x] Demo video script (docs/demo-script.md)
- [x] Architecture diagram (docs/architecture.svg)
- [x] BUGS.md, IDEAS.md, CHANGELOG.md

### What's NOT Done
- [ ] Public GitHub repo (JAY ACTION: flip repo to public)
- [ ] GDG membership (+0.2 bonus) (JAY ACTION: join GDG)
- [ ] Demo video recording (JAY ACTION: needs real piano + camera)
- [ ] Final Devpost submission form (JAY ACTION: submit on devpost.com)
- [ ] Architecture diagram update for v0.4+ (MIDI input, hand tracking, tool calls)
- [ ] Final polish pass on UI
- [ ] End-to-end rehearsal with real piano

### The "Wikipedia Vanishing Accessibility" Moment

**Our moment: The agent says "I can see your 3rd finger collapsing" while the Finger Tracking panel shows EYE: "3rd finger flat at knuckle" + EAR: "E note 20% softer than C and G".**

No other entry fuses real-time vision + structured performance data into correlated feedback. The report_technique tool output IS the proof. When judges see the EYE/EAR panel update in sync with the agent's voice, that's the moment they remember.

**Secondary moment: Score climbing from 40 to 85.** Quantifiable proof that AI coaching works.

---

## Day 1 — March 13 (Thursday): Polish & Rehearse

### Claude (Architecture)
- [ ] Review agent prompt — ensure report_technique is called frequently enough
- [ ] Verify tool call flow works end-to-end with real piano input (if Jay tests)
- [ ] Architecture decision: any last features worth adding?

### Codex (Routine)
- [ ] Update architecture.svg for v0.4+ (add MIDI input flow, hand tracking, tool calls)
- [ ] Commit all uncommitted changes as v0.4.7
- [ ] Redeploy to Cloud Run
- [ ] Run WebSocket test against deployed version

### Gemini (Docs)
- [ ] Final pass on blog-post.md — ensure it matches v0.4+ architecture
- [ ] Final pass on devpost-description.md — proofread, verify accuracy
- [ ] Update demo-script.md for any v0.4+ UI changes

### Jay (Required)
- [ ] Test with real piano + camera — report any issues
- [ ] Confirm GDG membership status
- [ ] Confirm public GitHub repo timing

---

## Day 2 — March 14 (Friday): Demo Video Prep

### Claude (Architecture)
- [ ] Fix any bugs from Jay's real-piano testing
- [ ] Last-minute prompt tuning based on real session behavior

### Codex (Routine)
- [ ] Any bug fixes from testing
- [ ] Final deploy with all fixes
- [ ] Version bump to v0.5.0 (demo-ready release)

### Gemini (Docs)
- [ ] Finalize demo-script.md with exact timing cues
- [ ] Prepare Devpost form text (all fields ready to paste)

### Jay (Required)
- [ ] Record demo video (≤4 min, following demo-script.md)
- [ ] Rehearsal: play C major triad badly → get coached → improve → score climbs
- [ ] Key shots: Finger Tracking panel, score climbing, scene transitions, achievement popup
- [ ] Flip GitHub repo to public

---

## Day 3 — March 15 (Saturday): Submit

### Claude (Architecture)
- [ ] Final review of all submission materials
- [ ] Verify deployed app is working

### Codex (Routine)
- [ ] Final deploy if any last changes
- [ ] Verify health endpoint, WebSocket connectivity

### Gemini (Docs)
- [ ] Any last doc fixes

### Jay (Required)
- [ ] Edit demo video if needed
- [ ] Submit on Devpost:
  - Project name, tagline, description
  - Demo video (YouTube/Vimeo link)
  - GitHub repo link
  - Cloud Run URL
  - Blog post link
  - GDG membership link
  - cloudbuild.yaml screenshot
- [ ] Submit BEFORE 5 PM PDT March 16 (buffer: submit by noon)

---

## Bonus Points Checklist

| Bonus | Points | Status |
|-------|--------|--------|
| Blog post with #GeminiLiveAgentChallenge | +0.6 | DONE (docs/blog-post.md) |
| IaC / cloudbuild.yaml | +0.2 | DONE (cloudbuild.yaml) |
| GDG membership | +0.2 | WAITING ON JAY |
| **Total possible** | **+1.0** | **+0.8 confirmed** |

---

## Agents That Can Help

| Agent | Session:Window | How They Help |
|-------|---------------|---------------|
| QA Vision | jworks:98 | Screenshot testing of deployed UI |
| LiveAgents Coordinator | jworks:99 | Task coordination, Jay communication |
| PianoQuest App | jworks:60 | Cross-pollination with mobile app |
| Vision Agent | jayhub:31 | Screenshots for documentation |
| Website Deploy | jworks:17 | If we need custom domain |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Jay can't record demo video | CRITICAL | Pre-record screen capture of WebSocket test as fallback |
| Tool calls don't fire during real piano session | HIGH | Test thoroughly on Day 1; fallback to keyword matching as backup |
| Cloud Run goes down during judging | MEDIUM | Health monitoring; redeploy if needed |
| GitHub repo not public by deadline | HIGH | Jay must flip before March 15 |
| GDG membership not done | LOW | Only +0.2 points; not worth blocking on |

---

## What Makes Us WIN

1. **Vision-audio correlation** — No other entry sees fingers AND hears music simultaneously. The report_technique tool proves this with structured EYE/EAR data.
2. **Quantifiable improvement** — Score 40→85 is not subjective. It's computed.
3. **Agent-driven UI** — Gemini controls scenes, badges, coaching tips via tool calls. Not keyword matching.
4. **Real creative skill development** — After using PianoQuest, you play piano better. AI amplifies human creativity.
5. **Production quality** — Dark theme, MIDI piano roll, hand tracking overlay, smooth animations. Looks like a product.
