# Music Notation Reference for Digital Sheet Music Rendering

This document covers standard Western music notation symbols, their visual appearance,
positioning rules, Unicode code points, and musical meaning. It is intended as a
reference for implementing a digital sheet music renderer.

---

## Table of Contents

1. [Note Types and Durations](#1-note-types-and-durations)
2. [Rest Symbols](#2-rest-symbols)
3. [Expression and Articulation Marks](#3-expression-and-articulation-marks)
4. [Tempo Markings](#4-tempo-markings)
5. [Dynamic Markings](#5-dynamic-markings)
6. [Ornaments](#6-ornaments)
7. [Pedal Markings](#7-pedal-markings)
8. [Other Symbols](#8-other-symbols)

---

## 1. Note Types and Durations

### 1.1 Note Value Table

| Name              | Beats (in 4/4) | Head Shape     | Stem | Flags/Beams | Unicode        |
|-------------------|-----------------|----------------|------|-------------|----------------|
| Whole note        | 4               | Hollow oval    | No   | None        | U+1D15D 𝅝     |
| Half note         | 2               | Hollow oval    | Yes  | None        | U+1D15E 𝅗𝅥     |
| Quarter note      | 1               | Filled oval    | Yes  | None        | U+1D15F 𝅘𝅥     |
| Eighth note       | 1/2             | Filled oval    | Yes  | 1 flag/beam | U+1D160 𝅘𝅥𝅮     |
| Sixteenth note    | 1/4             | Filled oval    | Yes  | 2 flags/beams | U+1D161 𝅘𝅥𝅯   |
| Thirty-second note| 1/8             | Filled oval    | Yes  | 3 flags/beams | U+1D162 𝅘𝅥𝅰   |

### 1.2 Notehead Shape

- **Hollow (open) notehead** (U+1D157): Used for whole notes and half notes. An
  elliptical outline with no fill, tilted slightly clockwise from horizontal.
- **Filled (black) notehead** (U+1D158): Used for quarter notes and shorter. A solid
  filled ellipse, same tilt as the hollow notehead.
- **Null (invisible) notehead** (U+1D159): Used in special contexts (e.g., rhythmic
  notation where pitch is unspecified).

**Rendering notes:**
- The notehead is approximately one staff-space tall (the distance between two
  adjacent staff lines).
- The notehead ellipse is tilted approximately 15-20 degrees clockwise from
  horizontal in standard engraving practice.
- The notehead width is roughly 1.2-1.4 times the staff-space height.

### 1.3 Stem Rules

**Direction:**
- Notes **below the middle line** (B4 in treble clef, D3 in bass clef): stem points **up**.
- Notes **on or above the middle line**: stem points **down**.
- Notes on the middle line itself can go either direction; convention often defaults
  to down, but context (neighboring notes) may dictate otherwise.
- In multi-voice writing, the upper voice always stems up, the lower voice always
  stems down, regardless of position.

**Attachment:**
- Stem-up: the stem attaches to the **right side** of the notehead, extending upward.
- Stem-down: the stem attaches to the **left side** of the notehead, extending downward.

**Length:**
- Standard stem length is one octave (3.5 staff spaces, or from the notehead to 3.5
  spaces away).
- If the notehead is on a ledger line more than an octave from the middle line, the
  stem extends to reach the middle line.

**Beamed groups:**
- When notes are beamed together, all stems in the group point the same direction.
- The direction is determined by the **average position** of the highest and lowest
  notes in the beamed group relative to the middle line.

### 1.4 Flags and Beams

**Flags** are curved strokes attached to the end of a stem on unbeamed notes:
- Always drawn on the **right side** of the stem, curving toward the notehead.
- Eighth note: 1 flag. Sixteenth: 2 flags. Thirty-second: 3 flags.
- Each additional flag halves the note duration.
- Unicode flag: U+1D16E (combining stem + single flag).

**Beams** replace flags when two or more short notes are adjacent:
- Eighth notes share 1 beam, sixteenth notes share 2 beams, thirty-second notes
  share 3 beams.
- Beams connect the ends of the stems with thick horizontal (or slightly angled)
  lines.
- Beams should **not cross barlines**.
- Beams should **not cross the center of a measure** (e.g., beats 2-3 boundary in 4/4).
- In 4/4 time, beam groupings typically follow beat boundaries: beats 1-2 grouped,
  beats 3-4 grouped.
- **Primary beam** (outermost) is continuous across the full group; **secondary beams**
  (inner) may be broken to show sub-beat groupings.
- Beam thickness: approximately 0.5 staff-spaces. Gap between multiple beams:
  approximately 0.25 staff-spaces.

### 1.5 Dotted Notes

A **dot** placed to the right of a notehead increases the note's duration by half its
original value.

| Notation       | Duration                  | Example in 4/4      |
|----------------|---------------------------|----------------------|
| Dotted whole    | 4 + 2 = 6 beats          | Spans 1.5 measures   |
| Dotted half     | 2 + 1 = 3 beats          | Common in 3/4 time   |
| Dotted quarter  | 1 + 0.5 = 1.5 beats      | Very common           |
| Dotted eighth   | 0.5 + 0.25 = 0.75 beats  | Often paired with 16th|

**Double dot:** adds half of the dot's value (i.e., 75% of the original). A double-dotted
half note = 2 + 1 + 0.5 = 3.5 beats.

**Positioning:**
- The dot is placed to the right of the notehead, horizontally centered in the next
  staff space.
- If the notehead sits on a line, the dot is shifted up into the space above.

### 1.6 Ties

A **tie** is a curved line connecting two adjacent notes of the **same pitch**, combining
their durations into a single sustained note. The second note is not re-attacked.

- Unicode: U+1D174 (musical symbol begin tie), U+1D175 (musical symbol end tie).
- Drawn as a curved arc between the two noteheads.
- Tie direction: curves **away** from the stem. Stem-up notes get a tie curving
  downward (below the noteheads); stem-down notes get a tie curving upward.
- Ties can span barlines (unlike beams).
- Visually similar to a slur, but ties connect notes of identical pitch only.

---

## 2. Rest Symbols

Rests indicate silence for a specified duration. Each note value has a corresponding rest.

### 2.1 Rest Table

| Name              | Beats (4/4) | Appearance                                   | Staff Position               | Unicode    |
|-------------------|-------------|----------------------------------------------|------------------------------|------------|
| Whole rest        | 4           | Filled rectangle hanging below a line         | Hangs from the 4th line      | U+1D13B 𝄻 |
| Half rest         | 2           | Filled rectangle sitting on top of a line     | Sits on the 3rd (middle) line| U+1D13C 𝄼 |
| Quarter rest      | 1           | Zigzag / lightning bolt shape                 | Centered vertically on staff | U+1D13D 𝄽 |
| Eighth rest       | 1/2         | Slanted stroke with one flag at top           | Centered vertically on staff | U+1D13E 𝄾 |
| Sixteenth rest    | 1/4         | Slanted stroke with two flags                 | Centered vertically on staff | U+1D13F 𝄿 |
| Thirty-second rest| 1/8         | Slanted stroke with three flags               | Centered vertically on staff | U+1D140 𝅀 |

### 2.2 Detailed Descriptions

**Whole rest:**
- A solid, filled rectangle approximately one staff-space wide and half a staff-space
  tall.
- **Hangs below** the fourth staff line (second line from top). The top edge of the
  rectangle touches the fourth line.
- A whole rest also serves as a "whole-measure rest" in any time signature, placed at
  the horizontal center of the measure.

**Half rest:**
- Identical rectangle to the whole rest, but **sits on top of** the third (middle)
  staff line. The bottom edge of the rectangle touches the middle line.
- Easy mnemonic: the half rest looks like a hat sitting on a line; the whole rest
  looks like a hole (hanging down).

**Quarter rest:**
- A complex zigzag shape resembling a stylized lightning bolt or reversed "Z" with
  curves.
- Occupies the middle three staff spaces (from the second line to the fourth line).
- No simple geometric description; best rendered from a font glyph (SMuFL: U+E4E5).

**Eighth rest:**
- A diagonal stroke going from lower-left to upper-right, with a small filled circle
  (flag) at the top, sitting in a staff space.
- The flag sits in the space between the 3rd and 4th lines.
- The stroke extends down to approximately the 2nd line.

**Sixteenth rest:**
- Same as the eighth rest but with **two flags**, vertically stacked.
- Extends slightly lower on the staff to accommodate the extra flag.

**Thirty-second rest:**
- Three flags on the diagonal stroke.
- Extends further to accommodate the third flag.

### 2.3 Positioning Rules

- Rests are generally **centered vertically** on the staff (with the exceptions of
  whole and half rests noted above).
- In multi-voice notation, rests are displaced vertically to align with their voice:
  upper voice rests shift up, lower voice rests shift down.
- A whole rest used as a whole-measure rest is centered horizontally in the measure.
- Other rests are positioned at their rhythmic location, evenly spaced with notes.

---

## 3. Expression and Articulation Marks

### 3.1 Staccato

- **Symbol:** A small dot placed directly above or below the notehead.
- **Unicode:** U+1D17C (combining staccato). Also commonly rendered as a simple dot.
- **Position:** Above the note if stem is down; below the note if stem is up. Always
  on the notehead side (opposite the stem). Placed approximately 0.5 staff-spaces
  away from the notehead or beam.
- **Meaning:** Play the note short and detached. The note sounds for roughly half its
  written duration, with silence filling the remainder.

### 3.2 Legato / Slur

- **Symbol:** A curved arc spanning two or more notes of **different** pitches.
- **Unicode:** U+1D176 (begin slur), U+1D177 (end slur).
- **Position:** Placed on the side opposite the stems. If stems are up, the slur
  curves above; if stems are down, the slur curves below.
- **Meaning:** Play the notes smoothly and connected, with no silence between them.
  On piano, this means holding each key until the next is pressed.

### 3.3 Accent

- **Symbol:** A sideways "V" or ">" placed above or below the note (pointing right).
- **Unicode:** U+1D17B (combining accent). Also represented as > in text.
- **Position:** Above the note (stem down) or below the note (stem up). Same
  placement rules as staccato.
- **Meaning:** Play the note with a strong, emphasized attack followed by a tapered
  release. Typically louder than surrounding notes.

### 3.4 Tenuto

- **Symbol:** A short horizontal line (dash) placed above or below the notehead.
- **Unicode:** U+1D17D (combining tenuto).
- **Position:** Same rules as staccato/accent (notehead side, opposite stem).
- **Meaning:** Hold the note for its full written duration (or slightly longer).
  Emphasizes sustain. Can also indicate a slight stress.

### 3.5 Fermata

- **Symbol:** A dot with a curved arc above it (looks like a bird's eye). Fermata
  below is the vertically flipped version.
- **Unicode:** U+1D110 𝄐 (fermata above), U+1D111 𝄑 (fermata below).
- **Position:** Placed above the staff (fermata above) on the notehead or rest it
  applies to. Fermata below is used in the lower staff of a grand staff or for
  inverted notation.
- **Meaning:** Hold the note or rest for longer than its written value. The duration
  is at the performer's or conductor's discretion, but typically 1.5x to 2x the
  written length. Also indicates a brief pause in tempo.

### 3.6 Marcato

- **Symbol:** An upward-pointing "V" or "^" (caret/hat) placed above the note.
  Sometimes called a "rooftop accent."
- **Unicode:** U+1D17E (combining marcato).
- **Position:** Always placed above the note, regardless of stem direction (in
  standard practice). Some modern engraving also allows below.
- **Meaning:** Play with a strong, sharp attack — more emphatic than a regular accent.
  Louder and more forceful than ">".

### 3.7 Sforzando

- **Symbol:** The text marking "sfz" or "sf" written below the staff.
- **Unicode:** No dedicated Unicode character; rendered as italic text.
- **Position:** Below the staff, aligned with the note or chord it applies to. Same
  position as dynamic markings.
- **Meaning:** A sudden, strong accent on a single note or chord. Louder than marcato.
  "Sforzando" means "forcing." Variants include sfp (sforzando then immediately
  piano) and fz (forzando).

### 3.8 Portato (Mezzo Staccato)

- **Symbol:** A combination of staccato dots under a slur line. Each note has a dot,
  and a slur arc covers the entire group.
- **Unicode:** No single dedicated character; combine slur + staccato dots.
- **Position:** Dots on the notehead side; slur on the opposite side from stems.
- **Meaning:** Play each note slightly separated but within a legato phrase. Longer
  than staccato but not fully connected. Sometimes described as "articulated legato."

---

## 4. Tempo Markings

Tempo markings are Italian words placed above the staff at the beginning of a piece
or section. They indicate the speed at which the music should be played.

### 4.1 Standard Tempo Table

| Marking     | BPM Range     | Italian Meaning           | Character       |
|-------------|---------------|---------------------------|-----------------|
| Grave       | 20-40         | Very slow, solemn         | —               |
| Largo       | 40-60         | Broadly, slowly           | —               |
| Larghetto   | 60-66         | Rather broadly            | —               |
| Adagio      | 66-76         | Slowly, at ease           | —               |
| Andante     | 76-108        | At a walking pace         | —               |
| Andantino   | 80-108        | Slightly faster than Andante | —            |
| Moderato    | 108-120       | Moderately                | —               |
| Allegretto  | 112-120       | Moderately fast           | —               |
| Allegro     | 120-156       | Fast, lively, bright      | —               |
| Vivace      | 156-176       | Lively, fast              | —               |
| Presto      | 168-200       | Very fast                 | —               |
| Prestissimo | 200+          | As fast as possible       | —               |

**Note:** BPM ranges are approximate and vary between sources and historical periods.
Baroque-era tempi, for example, were generally faster for terms like "Largo" and
"Adagio" than modern interpretations.

### 4.2 Tempo Modifiers

| Modifier      | Meaning                        |
|---------------|--------------------------------|
| molto         | Very (e.g., Allegro molto)     |
| assai         | Very, quite                    |
| con brio      | With vigor, spirited           |
| con moto      | With motion                    |
| ma non troppo | But not too much               |
| piu mosso     | More motion (speed up)         |
| meno mosso    | Less motion (slow down)        |
| a tempo       | Return to the original tempo   |
| rubato        | Flexible tempo, "stolen time"  |

### 4.3 Tempo Change Markings

| Marking           | Meaning                                  |
|-------------------|------------------------------------------|
| accelerando (accel.) | Gradually getting faster              |
| ritardando (rit.)    | Gradually getting slower              |
| rallentando (rall.)  | Gradually getting slower (same as rit.)|
| stringendo         | Pressing forward, getting faster        |
| allargando         | Broadening, getting slower and louder   |
| tempo primo        | Return to the first tempo of the piece  |

### 4.4 Metronome Marking

A precise tempo indication using a note value equated to a BPM number.

- **Format:** [quarter note symbol] = 120 (meaning 120 quarter-note beats per minute).
- **Position:** Above the staff, at the beginning of the piece or at tempo changes.
  Usually placed to the right of any Italian tempo word.
- In rendering, use a small notehead with stem, followed by "= [number]".

---

## 5. Dynamic Markings

Dynamic markings indicate the volume (loudness) of the music. They use abbreviations
of Italian words.

### 5.1 Dynamic Levels

| Marking | Full Italian      | Meaning             | Approximate dB Range |
|---------|-------------------|---------------------|----------------------|
| ppp     | pianississimo     | Extremely soft      | ~40 dB               |
| pp      | pianissimo        | Very soft           | ~45 dB               |
| p       | piano             | Soft                | ~50 dB               |
| mp      | mezzo piano       | Moderately soft     | ~55 dB               |
| mf      | mezzo forte       | Moderately loud     | ~65 dB               |
| f       | forte             | Loud                | ~75 dB               |
| ff      | fortissimo        | Very loud           | ~85 dB               |
| fff     | fortississimo     | Extremely loud      | ~90 dB               |

### 5.2 Unicode for Dynamics

| Symbol | Unicode     | Name                              |
|--------|-------------|-----------------------------------|
| p      | U+1D18F 𝆏  | MUSICAL SYMBOL PIANO              |
| m      | U+1D190 𝆐  | MUSICAL SYMBOL MEZZO              |
| f      | U+1D191 𝆑  | MUSICAL SYMBOL FORTE              |
| cresc. | U+1D192 𝆒  | MUSICAL SYMBOL CRESCENDO          |
| decresc.| U+1D193 𝆓 | MUSICAL SYMBOL DECRESCENDO        |

**Note:** In practice, dynamics are typically rendered using a dedicated music font
(e.g., Bravura, Opus) rather than Unicode characters, because the italic, bold style
of engraved dynamics does not match standard Unicode text rendering.

### 5.3 Crescendo and Decrescendo (Hairpins)

- **Crescendo:** A long, opening wedge shape (< or "hairpin") indicating a gradual
  increase in volume. The narrow end is at the start, widening toward the louder
  dynamic.
- **Decrescendo (diminuendo):** A closing wedge (>) indicating a gradual decrease in
  volume. The wide end is at the start, narrowing toward the softer dynamic.
- **Position:** Below the staff, horizontally spanning the notes over which the volume
  change occurs. Vertically aligned with dynamic text markings.
- **Rendering:** Two angled lines meeting at a point. The hairpin height is
  approximately 1 staff-space. The length corresponds to the rhythmic duration of the
  change.

### 5.4 Positioning Rules

- Dynamic markings are placed **below the staff** for all instruments except voice,
  where they go above.
- In grand staff (piano), dynamics are placed between the two staves or below the
  bottom staff.
- Dynamics align horizontally with the note or beat they take effect on.
- Hairpins span from one dynamic level to another and should not extend past barlines
  without clear intent.

---

## 6. Ornaments

Ornaments are embellishments added to the basic melody. They are shown as small symbols
above or below notes.

### 6.1 Trill

- **Symbol:** "tr" or "tr" followed by a wavy line (~~~).
- **Unicode:** U+1D196 (musical symbol tr), U+1D197 (musical symbol turn).
  SMuFL: U+E566 (trill).
- **Position:** Above the note, with the wavy line extending to the right for the
  duration of the trill.
- **Meaning:** Rapidly alternate between the written note and the note above it
  (diatonic step). The alternation continues for the full duration of the note.
- **Execution:** Start on the principal note (modern convention) or the upper note
  (Baroque convention). End on the principal note. A small termination figure
  (turn-like ending) is common.

### 6.2 Mordent

**Upper mordent:**
- **Symbol:** A short wavy line (like a compressed trill) above the note.
- **Unicode:** U+1D19A (mordent). SMuFL: U+E56C.
- **Position:** Above the notehead.
- **Meaning:** Play the written note, quickly move to the note **above**, and return.
  Three notes total (principal-upper-principal), performed very quickly at the start
  of the note.

**Lower mordent (inverted mordent):**
- **Symbol:** A short wavy line with a vertical line through it.
- **Unicode:** U+1D19B (inverted mordent).
- **Position:** Above the notehead.
- **Meaning:** Play the written note, quickly move to the note **below**, and return.
  Three notes total (principal-lower-principal).

### 6.3 Turn

- **Symbol:** An S-shaped figure lying on its side, resembling a horizontally-flipped
  "S" or the infinity symbol.
- **Unicode:** U+1D197 (turn). SMuFL: U+E567.
- **Position:** Above the note (played immediately) or between two notes (played at
  the midpoint).
- **Meaning:** A four-note figure: note above, principal note, note below, principal
  note. When placed between two notes, the turn is played in the time between them.

**Inverted turn:**
- **Symbol:** Same shape but vertically flipped (or with a vertical line through it).
- **Unicode:** U+1D198 (inverted turn).
- **Meaning:** Note below, principal, note above, principal.

### 6.4 Grace Notes

Grace notes are small-sized notes that serve as ornamental approaches to a main note.

**Acciaccatura (short grace note):**
- **Symbol:** A small note (usually an eighth note) with a slash through the stem/flag.
- **Unicode:** U+1D199 (combining long/short grace note — context varies).
  SMuFL: U+E560 (acciaccatura).
- **Position:** Immediately before the main note, slightly to its left, at a smaller
  size (approximately 60% of a normal notehead).
- **Meaning:** Played as quickly as possible, crushed into the main note. Takes its
  time from the **main note** (or the preceding note, depending on style). Almost
  no perceptible duration.

**Appoggiatura (long grace note):**
- **Symbol:** A small note (without a slash) before the main note.
- **SMuFL:** U+E561 (appoggiatura).
- **Position:** Same as acciaccatura but without the slash.
- **Meaning:** Takes a significant portion of the main note's duration (typically half,
  but context-dependent). The grace note is melodically important, creating a
  dissonance that resolves to the main note. Accented on the grace note, not the
  main note.

### 6.5 Tremolo

- **Symbol:** One or more diagonal slashes through the stem of a note (single-note
  tremolo), or slashes between two notes (double-note tremolo).
- **Position:** Through the stem, between the notehead and the beam/flag area.
- **Meaning:**
  - **Single-note tremolo:** Rapidly repeat the note. One slash = eighth-note
    repetitions, two slashes = sixteenth, three slashes = thirty-second or
    unmeasured tremolo.
  - **Double-note tremolo (fingered tremolo):** Rapidly alternate between two notes.
    Slashes are drawn between the stems of the two notes.
- **Rendering:** Draw 1-3 thick diagonal lines (same thickness as beams) across the
  stem at a 45-degree angle.

---

## 7. Pedal Markings

Pedal markings are specific to keyboard instruments (primarily piano).

### 7.1 Sustain Pedal (Damper Pedal — Right Pedal)

**Traditional notation:**
- **Engage:** "Ped." written below the staff in italic text.
- **Release:** An asterisk "*" (sometimes rendered as a decorative star/snowflake).
- **Unicode:** U+1D1AE (Ped.), U+1D1AF (*). These are part of the Unicode musical
  symbols block but font support is limited.
- **Position:** Below the bottom staff of a grand staff system.

**Bracket notation (modern/preferred for precise pedaling):**
- A horizontal line below the staff shows when the pedal is depressed.
- A downward "V" notch in the line indicates a quick lift-and-repress (half-pedal
  change or "legato pedaling").
- The line begins where the pedal is pressed and ends where it is released.
- **Pattern:** `___/\___/\___` where `___` = pedal down, `/\` = quick release and
  re-engage.

**Rendering:**
- Draw a horizontal line at a fixed distance below the lowest staff.
- At each pedal change, draw a short V-shaped dip (release-repress).
- At the final release, the line simply ends.

### 7.2 Soft Pedal (Una Corda — Left Pedal)

- **Engage:** "una corda" (meaning "one string") written below the staff in italic.
- **Release:** "tre corde" (meaning "three strings") written below the staff.
- **Position:** Below the sustain pedal markings if both are present.
- **Meaning:** Shifts the hammer mechanism so fewer strings are struck per note,
  producing a softer, more muted tone color. Not merely quieter — the timbre changes.

### 7.3 Sostenuto Pedal (Middle Pedal)

- **Engage:** "Sost. Ped." written below the staff.
- **Release:** Asterisk "*" (same as sustain pedal release).
- **Meaning:** Sustains only the notes that are already held down at the moment the
  pedal is pressed. Other notes played afterward are not sustained.
- **Usage:** Rare in standard repertoire. Most common in 20th-century and contemporary
  music.

---

## 8. Other Symbols

### 8.1 Repeat Signs

**Simple repeat (barline repeats):**
- **Start repeat:** A thick barline + thin barline + two dots (in spaces 2 and 3).
  Unicode: U+1D106 𝄆 (left repeat sign).
- **End repeat:** Two dots + thin barline + thick barline (mirror of start repeat).
  Unicode: U+1D107 𝄇 (right repeat sign).
- **Position:** At the barline position. The two dots are vertically centered on the
  staff, typically in the second and third spaces (surrounding the middle line).
- **Meaning:** Repeat the enclosed section. If no start repeat is present, repeat from
  the beginning.

**First and second endings (volta brackets):**
- **Symbol:** A bracket above the staff with the number "1." or "2." at the left end.
  A horizontal line extends to the right. The first ending bracket has a right-side
  hook; the second ending may have an open right side.
- **Position:** Above the staff, spanning the measures of each ending.
- **Meaning:**
  - 1st ending: Play this section the first time through.
  - 2nd ending: Skip the 1st ending and play this section on the repeat.
  - Can extend to 3rd, 4th endings, etc.

**Measure repeat:**
- **Symbol:** A single diagonal slash with dots on either side (%) centered in a
  measure.
- **Meaning:** Repeat the previous measure exactly.

### 8.2 Coda

- **Symbol:** A circle with a cross (plus sign) through it, resembling a target or
  crosshair.
- **Unicode:** U+1D10C 𝄌 (musical symbol coda).
- **Position:** Above the staff, at the point where the coda section begins and at the
  jump destination.
- **Meaning:** Marks the final section of a piece. Used with "al Coda" or "D.S. al
  Coda" to indicate where to jump to the ending section.

### 8.3 Segno

- **Symbol:** An ornate S-shaped sign with a line through it and dots on either side.
  Resembles a fancy dollar sign or ornamental S.
- **Unicode:** U+1D10B 𝄋 (musical symbol segno).
- **Position:** Above the staff, at the point the performer should return to.
- **Meaning:** A navigation marker. The performer jumps back to this sign when
  instructed by "D.S." (Dal Segno).

### 8.4 Da Capo (D.C.)

- **Symbol:** The text "D.C." (abbreviation of "Da Capo") written above or below the
  staff.
- **Unicode:** U+1D10A 𝄊 (musical symbol da capo). Rarely used; "D.C." as text is
  standard.
- **Position:** Above the staff at the end of a section.
- **Meaning:** "From the head" — return to the very beginning of the piece and play
  again.

**Common variants:**
- **D.C. al Fine:** Return to the beginning and play until "Fine" (the end marker).
- **D.C. al Coda:** Return to the beginning, play until "To Coda" (or coda symbol),
  then jump to the Coda section.

### 8.5 Dal Segno (D.S.)

- **Symbol:** The text "D.S." written above or below the staff.
- **Unicode:** U+1D109 𝄉 (musical symbol dal segno).
- **Position:** Above the staff at the end of a section.
- **Meaning:** "From the sign" — return to the Segno symbol and play from there.

**Common variants:**
- **D.S. al Fine:** Return to the segno, play until "Fine."
- **D.S. al Coda:** Return to the segno, play until "To Coda," then jump to the Coda.

### 8.6 Fine

- **Symbol:** The word "Fine" written above or below the staff, often in italic.
- **Position:** Above the staff at the measure where the piece ends (when reached via
  D.C. or D.S.).
- **Meaning:** "The end." Stop playing here.

### 8.7 Key Signatures

Key signatures are placed at the beginning of each staff (after the clef) to indicate
which notes are sharped or flatted throughout the piece.

**Sharps and flats:**
- **Sharp:** U+266F ♯ — Raises a note by a half step.
- **Flat:** U+266D ♭ — Lowers a note by a half step.
- **Natural:** U+266E ♮ — Cancels a previous sharp or flat.
- **Double sharp:** U+1D12A 𝄪 — Raises a note by two half steps.
- **Double flat:** U+1D12B 𝄫 — Lowers a note by two half steps.

**Order of sharps in key signatures:** F - C - G - D - A - E - B
(Mnemonic: Father Charles Goes Down And Ends Battle)

**Order of flats in key signatures:** B - E - A - D - G - C - F
(Reverse of sharps; mnemonic: Battle Ends And Down Goes Charles' Father)

**Position on treble clef staff (sharps):**
| Sharp # | Note | Line/Space |
|---------|------|------------|
| 1       | F#   | 5th line   |
| 2       | C#   | 3rd space  |
| 3       | G#   | Above staff (5th line + space) |
| 4       | D#   | 4th line   |
| 5       | A#   | 2nd space  |
| 6       | E#   | 4th space  |
| 7       | B#   | 3rd line   |

**Position on treble clef staff (flats):**
| Flat # | Note | Line/Space |
|--------|------|------------|
| 1      | Bb   | 3rd line   |
| 2      | Eb   | 4th space  |
| 3      | Ab   | 2nd line (or above: 3rd line - 1) |
| 4      | Db   | 3rd space  |
| 5      | Gb   | 2nd space (1st line + 1) |
| 6      | Cb   | 4th line   |
| 7      | Fb   | 2nd line   |

**Key-to-signature mapping (major keys):**

| Sharps | Key Major | Key Minor |
|--------|-----------|-----------|
| 0      | C         | Am        |
| 1      | G         | Em        |
| 2      | D         | Bm        |
| 3      | A         | F#m       |
| 4      | E         | C#m       |
| 5      | B         | G#m       |
| 6      | F#        | D#m       |
| 7      | C#        | A#m       |

| Flats  | Key Major | Key Minor |
|--------|-----------|-----------|
| 1      | F         | Dm        |
| 2      | Bb        | Gm        |
| 3      | Eb        | Cm        |
| 4      | Ab        | Fm        |
| 5      | Db        | Bbm       |
| 6      | Gb        | Ebm       |
| 7      | Cb        | Abm       |

### 8.8 Time Signatures

Time signatures appear at the beginning of a piece (after the key signature) and
wherever the meter changes.

**Format:** Two numbers stacked vertically (fraction-like, but without a line):
- **Top number:** How many beats per measure.
- **Bottom number:** Which note value gets one beat (4 = quarter, 8 = eighth, etc.).

**Common time signatures:**

| Signature | Beats | Beat Unit  | Feel              | Unicode/Symbol       |
|-----------|-------|------------|-------------------|----------------------|
| 4/4       | 4     | Quarter    | Common time       | U+1D134 𝄴 (C symbol)|
| 2/2       | 2     | Half       | Cut time/Alla breve| U+1D135 𝄵 (C with line)|
| 3/4       | 3     | Quarter    | Waltz             | —                    |
| 6/8       | 6     | Eighth     | Compound duple    | —                    |
| 2/4       | 2     | Quarter    | March             | —                    |
| 3/8       | 3     | Eighth     | Compound (fast 1) | —                    |
| 9/8       | 9     | Eighth     | Compound triple   | —                    |
| 12/8      | 12    | Eighth     | Compound quadruple| —                    |
| 5/4       | 5     | Quarter    | Irregular/additive| —                    |
| 7/8       | 7     | Eighth     | Irregular/additive| —                    |

**Common time (C):** U+1D134 𝄴 — A stylized letter "C" used as shorthand for 4/4.
Not actually a "C" historically; derived from a broken circle in mensural notation.

**Cut time (alla breve):** U+1D135 𝄵 — The common time "C" with a vertical line
through it. Shorthand for 2/2.

**Position:** Centered vertically on the staff. The top number occupies the top two
spaces; the bottom number occupies the bottom two spaces. Rendered using a music font
for proper engraving appearance.

### 8.9 Barlines

| Type            | Appearance                          | Unicode   | Meaning                         |
|-----------------|-------------------------------------|-----------|---------------------------------|
| Single          | One thin vertical line              | U+1D100 𝄀| Separates measures              |
| Double          | Two thin vertical lines             | U+1D101 𝄁| Marks section boundaries        |
| Final (end)     | Thin line + thick line              | U+1D102 𝄂| End of piece                    |
| Reverse final   | Thick line + thin line              | U+1D103 𝄃| Start of piece (rare)           |
| Dashed          | Dashed/dotted vertical line         | U+1D104 𝄄| Subdivides long measures        |
| Short           | Short vertical line (partial staff) | U+1D105 𝄅| Breath mark or phrase division  |

### 8.10 Clefs

| Clef           | Unicode   | Position on Staff                    | Middle C Location     |
|----------------|-----------|--------------------------------------|-----------------------|
| Treble (G)     | U+1D11E 𝄞| Curls around the 2nd line (G4)       | One ledger line below |
| Bass (F)       | U+1D122 𝄢| Two dots surround the 4th line (F3)  | One ledger line above |
| Alto (C)       | U+1D121 𝄡| Points to the 3rd line (C4)          | 3rd line              |
| Tenor (C)      | —         | Points to the 4th line (C4)          | 4th line              |

**Treble clef:** The most common clef. A stylized, ornate curve that wraps around
the second staff line, establishing it as G4 (G above middle C).

**Bass clef:** Resembles a stylized letter "F" with two dots flanking the fourth
line, establishing it as F3 (F below middle C).

**Grand staff (piano):** Treble clef on top staff + bass clef on bottom staff,
connected by a brace on the left. Middle C sits on a shared ledger line between the
two staves.

---

## Appendix A: Unicode Musical Symbols Quick Reference

### Core Notation (U+1D100-U+1D1FF)

| Code Point | Char | Name                              |
|------------|------|-----------------------------------|
| U+1D100    | 𝄀   | Single barline                    |
| U+1D101    | 𝄁   | Double barline                    |
| U+1D102    | 𝄂   | Final barline                     |
| U+1D103    | 𝄃   | Reverse final barline             |
| U+1D104    | 𝄄   | Dashed barline                    |
| U+1D105    | 𝄅   | Short barline                     |
| U+1D106    | 𝄆   | Left repeat sign                  |
| U+1D107    | 𝄇   | Right repeat sign                 |
| U+1D109    | 𝄉   | Dal segno                         |
| U+1D10A    | 𝄊   | Da capo                           |
| U+1D10B    | 𝄋   | Segno                             |
| U+1D10C    | 𝄌   | Coda                              |
| U+1D110    | 𝄐   | Fermata (above)                   |
| U+1D111    | 𝄑   | Fermata (below)                   |
| U+1D11E    | 𝄞   | G clef (treble)                   |
| U+1D121    | 𝄡   | C clef (alto/tenor)               |
| U+1D122    | 𝄢   | F clef (bass)                     |
| U+1D12A    | 𝄪   | Double sharp                      |
| U+1D12B    | 𝄫   | Double flat                       |
| U+1D134    | 𝄴   | Common time                       |
| U+1D135    | 𝄵   | Cut time (alla breve)             |
| U+1D13B    | 𝄻   | Whole rest                        |
| U+1D13C    | 𝄼   | Half rest                         |
| U+1D13D    | 𝄽   | Quarter rest                      |
| U+1D13E    | 𝄾   | Eighth rest                       |
| U+1D13F    | 𝄿   | Sixteenth rest                    |
| U+1D140    | 𝅀   | Thirty-second rest                |
| U+1D157    | 𝅗   | Void notehead (hollow)            |
| U+1D158    | 𝅘   | Notehead black (filled)           |
| U+1D15D    | 𝅝   | Whole note                        |
| U+1D15E    | 𝅗𝅥   | Half note                         |
| U+1D15F    | 𝅘𝅥   | Quarter note                      |
| U+1D160    | 𝅘𝅥𝅮   | Eighth note                       |
| U+1D161    | 𝅘𝅥𝅯   | Sixteenth note                    |
| U+1D162    | 𝅘𝅥𝅰   | Thirty-second note                |
| U+1D18F    | 𝆏   | Piano (p)                         |
| U+1D190    | 𝆐   | Mezzo (m)                         |
| U+1D191    | 𝆑   | Forte (f)                         |
| U+1D192    | 𝆒   | Crescendo                         |
| U+1D193    | 𝆓   | Decrescendo                       |

### Common Non-Block Characters

| Code Point | Char | Name                              |
|------------|------|-----------------------------------|
| U+266D     | ♭   | Music flat sign                   |
| U+266E     | ♮   | Music natural sign                |
| U+266F     | ♯   | Music sharp sign                  |

### SMuFL Recommendations

For production sheet music rendering, use SMuFL-compliant fonts (Bravura, Petaluma,
Leland, etc.) which map thousands of glyphs to the Private Use Area starting at
U+E000. SMuFL provides far more granular symbols than the Unicode Musical Symbols
block, including:
- Individual noteheads in multiple styles
- Accidentals with microtonal variants
- Articulations with precise positioning anchors
- Dynamics with proper italic bold styling
- Ornament symbols with all variants

The SMuFL specification is maintained by the W3C Music Notation Community Group at
https://www.w3.org/groups/cg/music-notation/.

---

## Appendix B: Rendering Priority for Digital Implementation

For a real-time digital renderer (e.g., visualizing live MIDI input), prioritize
implementation in this order:

1. **Essential (minimum viable):** Noteheads (filled/hollow), stems, beams, barlines,
   clefs (treble + bass), time signature, key signature, ledger lines.
2. **Important:** Rests, dots, ties, slurs, accidentals (sharp/flat/natural), dynamics
   (p/f/mf/mp), basic articulations (staccato, accent).
3. **Enhanced:** Tempo markings, crescendo/decrescendo hairpins, fermata, repeat signs,
   first/second endings, pedal markings.
4. **Advanced:** Ornaments (trill, mordent, turn, grace notes), tremolo, coda/segno
   navigation, marcato, tenuto, portato, extended dynamics (ppp/fff).
