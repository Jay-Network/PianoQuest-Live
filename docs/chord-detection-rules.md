# Chord Detection Rules

Canonical reference for chord detection across PianoQuest Live, PianoQuest Desktop, and jayismocking.com/live.

All implementations must follow these rules exactly.

## 1. Input: Finger-Down Notes Only

- Detect chords using **only notes with fingers physically on keys** (`fingerDownNotes`).
- **Pedal-sustained notes must NOT count** toward chord identification.
- Rationale: pedal-held notes linger after release and would pollute chord detection with stale pitches.

## 2. Detect on NoteOn Only

- Call chord detection **only on NoteOn** events (when a key is pressed).
- **Do NOT re-detect on NoteOff.** On NoteOff, only clear the last chord symbol when fewer than 2 finger-down notes remain.
- Rationale: NoteOff re-detection produces phantom chord labels as fingers release.

## 3. Debounced Detection from All Finger-Down Notes

- Detect from **ALL currently finger-down notes**, not a time-windowed subset.
- The configurable time window (default: **50ms**) is used as a **debounce delay**:
  - On each NoteOn, reset the debounce timer.
  - After the window expires with no new NoteOn, detect from all `fingerDownNotes`.
  - This prevents stamping intermediate chords during rapid presses (C → CE → CEG only stamps CEG).
- This ensures that modifying one note of a held chord (e.g. moving C up an octave while holding E,G,Bb,D) still detects the full chord from all held keys.

### Chord Window Control

- **UI**: `Chord: 50ms` with +/- buttons (10ms steps, range 10-200ms).
- **Position**: Top-right corner of the grand staff, as a semi-transparent overlay.
- **On /live (spectator page)**: This control is **admin-only**. Regular viewers must not see or adjust it.

## 4. Chord Templates

Templates are ordered by interval count. Detection tries all roots x all templates.

### 2-Note (Intervals)
| Name | Intervals | Example |
|------|-----------|---------|
| `5` (power chord) | [0, 7] | C5 = C, G |

### 3-Note (Triads)
| Name | Intervals | Example |
|------|-----------|---------|
| `maj` | [0, 4, 7] | C = C, E, G |
| `min` | [0, 3, 7] | Cmin = C, Eb, G |
| `dim` | [0, 3, 6] | Cdim = C, Eb, Gb |
| `aug` | [0, 4, 8] | Caug = C, E, G# |
| `sus4` | [0, 5, 7] | Csus4 = C, F, G |
| `sus2` | [0, 2, 7] | Csus2 = C, D, G |

### 4-Note (Sevenths / Add)
| Name | Intervals | Example |
|------|-----------|---------|
| `7` | [0, 4, 7, 10] | C7 = C, E, G, Bb |
| `maj7` | [0, 4, 7, 11] | Cmaj7 = C, E, G, B |
| `min7` | [0, 3, 7, 10] | Cmin7 = C, Eb, G, Bb |
| `dim7` | [0, 3, 6, 9] | Cdim7 = C, Eb, Gb, A |
| `add9` | [0, 4, 7, 2] | Cadd9 = C, E, G, D |
| `madd9` | [0, 3, 7, 2] | Cmadd9 = C, Eb, G, D |

### 5-Note (Ninths)
| Name | Intervals | Example |
|------|-----------|---------|
| `9` | [0, 4, 7, 10, 2] | C9 = C, E, G, Bb, D |
| `maj9` | [0, 4, 7, 11, 2] | Cmaj9 = C, E, G, B, D |
| `min9` | [0, 3, 7, 10, 2] | Cmin9 = C, Eb, G, Bb, D |

Note: 9th intervals are stored as mod-12 values (14 % 12 = 2).

### Note Names for Roots
```
['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
```

### Display Name Rules
- Major triads (3 or fewer unique pitch classes): show root only (e.g. "C", not "Cmaj")
- All others: show root + template name (e.g. "Cmin7", "G9", "Dsus4")

## 5. Scoring Algorithm

Detection tries every pitch class as a potential root against every template.

### Score Formula

```
templateFit = matchedNotes / template.intervals.length
coverage    = matchedNotes / uniquePitchClasses.length
score       = (templateFit + coverage) / 2
```

- **templateFit**: How completely the template is matched (are all template notes present?)
- **coverage**: How many of the played notes are explained by this template (are there unexplained notes?)
- **Combined score** prevents short templates from winning when they leave input notes unexplained.

### Example: G, Bb, D, A

| Candidate | Match | templateFit | coverage | score |
|-----------|-------|-------------|----------|-------|
| Dsus4 (D,G,A) | 3/3 | 1.00 | 3/4 = 0.75 | **0.875** |
| Gmadd9 (G,Bb,D,A) | 4/4 | 1.00 | 4/4 = 1.00 | **1.000** |

Result: **Gmadd9** wins because it explains all input notes.

### Minimum Match Threshold

```
minMatch = max(2, template.intervals.length - 1)
```

- **2-note templates**: Need exact match (both notes). Power chord C5 needs both C and G.
- **3-note templates**: Need at least 2/3. G+B alone does NOT trigger "G" — needs G+B+D.
- **4-note templates**: Need at least 3/4.
- **5-note templates**: Need at least 4/5.

### Tiebreaking

When two candidates have equal combined scores, prefer the one with **more matched notes** (longer template wins). This ensures C7 is preferred over C when 4 notes are present and both score equally.

## 6. Visual Rendering

### Position
- Each chord label is drawn **above the highest MIDI note** in that chord event.
- Y position: `midiToY(highestMidi) - 8px`, clamped to minimum 14px from top of canvas.
- X position: `playLineX - (nowMs - event.timestampMs) * pxPerMs` (scrolls left with notes).

### Style
- Font: `bold 13px DM Sans, sans-serif`
- Color: `rgba(255, 220, 100, alpha)` (gold)
- Alpha fades near left margin: `max(0, (chordX - marginLeft) / 30)`

### Collision Avoidance
- Track the leftmost edge of the previous (rightward) label.
- Skip rendering any label whose right edge + 6px minimum gap would overlap.
- Use `measureText()` for accurate width calculation.
- Iterate from newest to oldest (right to left).

### Limits
- Maximum 200 chord events stored (`MAX_CHORD_EVENTS`).
- Labels off-screen left (< marginLeft - 20px) stop iteration (break).
- Labels off-screen right (> W + 20px) are skipped (continue).

## 7. Reference Implementation

```javascript
const CHORD_TEMPLATES = [
  { name: 'maj',   intervals: [0,4,7] },
  { name: 'min',   intervals: [0,3,7] },
  { name: 'dim',   intervals: [0,3,6] },
  { name: 'aug',   intervals: [0,4,8] },
  { name: '7',     intervals: [0,4,7,10] },
  { name: 'maj7',  intervals: [0,4,7,11] },
  { name: 'min7',  intervals: [0,3,7,10] },
  { name: 'dim7',  intervals: [0,3,6,9] },
  { name: 'sus4',  intervals: [0,5,7] },
  { name: 'sus2',  intervals: [0,2,7] },
  { name: '9',     intervals: [0,4,7,10,2] },
  { name: 'maj9',  intervals: [0,4,7,11,2] },
  { name: 'min9',  intervals: [0,3,7,10,2] },
  { name: 'add9',  intervals: [0,4,7,2] },
  { name: 'madd9', intervals: [0,3,7,2] },
  { name: '5',     intervals: [0,7] },
];
const CHORD_NOTE_NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];

function detectChord(midiNotes) {
  if (midiNotes.length < 2) return '';
  var pcs = [], seen = {};
  for (var i = 0; i < midiNotes.length; i++) {
    var pc = midiNotes[i] % 12;
    if (!seen[pc]) { pcs.push(pc); seen[pc] = true; }
  }
  if (pcs.length < 2) return '';
  var best = '', bestScore = -1, bestMatch = 0;
  for (var r = 0; r < pcs.length; r++) {
    var root = pcs[r];
    for (var t = 0; t < CHORD_TEMPLATES.length; t++) {
      var tmpl = CHORD_TEMPLATES[t];
      var match = 0;
      for (var ti = 0; ti < tmpl.intervals.length; ti++) {
        if (seen[(root + tmpl.intervals[ti]) % 12]) match++;
      }
      var templateFit = match / tmpl.intervals.length;
      var coverage = match / pcs.length;
      var score = (templateFit + coverage) / 2;
      var minMatch = Math.max(2, tmpl.intervals.length - 1);
      if (match >= minMatch && (score > bestScore || (score === bestScore && match > bestMatch))) {
        bestScore = score;
        bestMatch = match;
        best = CHORD_NOTE_NAMES[root] + (tmpl.name === 'maj' && pcs.length <= 3 ? '' : tmpl.name);
      }
    }
  }
  return best;
}
```

## Changelog

| Date | Change |
|------|--------|
| 2026-03-29 | Initial chord detection (v3.2.87) |
| 2026-03-29 | fingerDownNotes only, no NoteOff re-detect (v3.2.88) |
| 2026-03-29 | Time-windowed grouping, chord window control (v3.2.89) |
| 2026-03-29 | Label above highest note, 5-note templates, tighter matching (v3.2.91) |
| 2026-03-29 | Tightened minMatch threshold (v3.2.92) |
| 2026-03-29 | Balanced scoring (templateFit + coverage), minadd9 template (v3.2.93) |
| 2026-03-29 | Detect from ALL finger-down notes with debounce instead of time-windowed group (v3.2.94) |
