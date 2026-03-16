# Grand Staff Tempo Calculation

## Problem
Changing BPM changes the visual width of measures. At 60 BPM measures are wide,
at 200 BPM they're narrow. User expects: measure width stays constant, higher
BPM = faster scroll speed.

## Variables
- `scrollableW` — pixels available for scrolling (canvas width - playLineX)
- `BPM` — beats per minute from slider
- `beatsPerMeasure` — from time signature (e.g., 4 for 4/4)
- `measureDurationMs = (60000 / BPM) * beatsPerMeasure`

## Current (wrong)
```
scrollWindow = 6000 ms (fixed)
pxPerMs = scrollableW / scrollWindow (constant ~0.1 px/ms)
measureWidthPx = measureDurationMs * pxPerMs  ← CHANGES with BPM
```
At 60 BPM, 4/4: measureDurationMs = 4000ms → measureWidthPx = 400px
At 120 BPM, 4/4: measureDurationMs = 2000ms → measureWidthPx = 200px  ← half width!

## Desired (correct)
Measure width is constant. Scroll speed (pxPerMs) changes with BPM.

```
measuresVisible = 4  (constant — always show ~4 measures in the scrollable area)
measureWidthPx = scrollableW / measuresVisible  (constant per canvas size)
pxPerMs = measureWidthPx / measureDurationMs  ← CHANGES with BPM (faster = more px/ms)
scrollWindow = scrollableW / pxPerMs  ← derived, changes with BPM
```

### Verification
At 60 BPM, 4/4 (measureDurationMs = 4000ms):
  measureWidthPx = scrollableW / 4
  pxPerMs = (scrollableW/4) / 4000 = scrollableW / 16000
  scrollWindow = scrollableW / (scrollableW/16000) = 16000ms (16 seconds visible)

At 120 BPM, 4/4 (measureDurationMs = 2000ms):
  measureWidthPx = scrollableW / 4  (same!)
  pxPerMs = (scrollableW/4) / 2000 = scrollableW / 8000
  scrollWindow = scrollableW / (scrollableW/8000) = 8000ms (8 seconds visible)

At 200 BPM, 4/4 (measureDurationMs = 1200ms):
  measureWidthPx = scrollableW / 4  (same!)
  pxPerMs = (scrollableW/4) / 1200 = scrollableW / 4800
  scrollWindow = 4800ms (4.8 seconds visible — fast scroll)

## Summary
Replace:
```js
var scrollWindow = 6000;
var pxPerMs = scrollableW / scrollWindow;
```
With:
```js
var measuresVisible = 4;
var measureWidthPx = scrollableW / measuresVisible;
var pxPerMs = measureWidthPx / measureDurationMs;
var scrollWindow = scrollableW / pxPerMs;
```
