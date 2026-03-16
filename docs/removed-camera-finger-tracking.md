# Removed: Camera + Finger Tracking Code (v2.0.3 → v2.1.0)

> **RESTORED in v3.1.0** — Re-implemented with hybrid approach (MediaPipe HandLandmarker client-side + Gemini Vision server-side). The implementation differs from the original (uses tasks-vision instead of legacy hands.js, camera runs on secondary device only, no standalone camera endpoint).

Originally stripped for competition deadline. Reference below for the original pieces:

## What was removed

1. **MediaPipe Hands** — hand skeleton overlay on camera feed
2. **Camera panel** — video preview with hand tracking badge
3. **Finger Tracking panel** — report_technique tool UI (EYE/EAR observations)
4. **report_technique tool** — Gemini tool for correlated vision+audio analysis
5. **Video frame sending** — capture canvas → base64 JPEG → Gemini every 1s
6. **Camera state sync** — camera_state/hand_state messages between client/server
7. **Standalone camera mode** — `?camera=1&room=CODE` phone camera endpoint
8. **wssCamera WebSocket** — `/ws/camera` server endpoint
9. **Secondary device camera role** — camera role in multi-device system
10. **Vision references in system instruction** — "SEE their hands", finger-specific coaching

## Key server.ts pieces to restore

### DeviceRoles
```typescript
interface DeviceRoles {
  mic: boolean;
  camera: boolean;  // <-- add back
  midi: boolean;
}
```

### RoomSession fields
```typescript
cameraEnabled: boolean;
bothHandsDetected: boolean;
detectedHandCount: number;
```

### describeMidiSnapshot params
```typescript
function describeMidiSnapshot(
  msg: Record<string, unknown>,
  cameraEnabled: boolean,
  bothHandsDetected: boolean,
  detectedHandCount: number
): string | null {
```

With vision state appended to return:
```typescript
const visionState = !cameraEnabled
  ? "Camera is off; do not claim visual observations."
  : bothHandsDetected
    ? "Both hands are visible; finger-specific visual coaching is allowed."
    : `Both hands not fully visible (detected: ${detectedHandCount}); no finger-specific observations.`;
```

### wssCamera endpoint
```typescript
wssCamera.on("connection", (ws: WebSocket) => {
  const room = (ws as any)._room as string;
  const session = rooms.get(room);
  // ... forward video_frame to session.sendRealtimeInput({ media: { data, mimeType: "image/jpeg" } })
});
```

### video_frame handler (primary)
```typescript
if (msgType === "video_frame") {
  session.sendRealtimeInput({
    media: { data: msg.data, mimeType: "image/jpeg" },
  });
}
```

## Key agent.ts pieces to restore

### report_technique tool
```typescript
{
  name: "report_technique",
  description: "Report a correlated vision + audio technique observation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      finger: { type: Type.STRING, description: 'Which finger(s)' },
      visual_observation: { type: Type.STRING, description: "What you SEE" },
      audio_observation: { type: Type.STRING, description: "What you HEAR" },
      suggestion: { type: Type.STRING, description: "Fix connecting visual cause to audio effect" },
    },
    required: ["finger", "visual_observation", "audio_observation", "suggestion"],
  },
}
```

### System instruction additions
```
You can SEE their hands via camera and receive MIDI data.
When both hands visible AND you have MIDI — connect what you see to what you hear.
If camera is off or hands not visible, say so honestly and coach from MIDI only.
```

## Key index.html pieces to restore

### MediaPipe script
```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
```

### Camera panel HTML
```html
<div class="panel">
  <div class="panel-header"><div class="dot" style="background:var(--rose)"></div>CAMERA</div>
  <div class="video-container">
    <video id="cameraVideo" autoplay playsinline muted></video>
    <canvas id="handOverlay"></canvas>
    <div class="video-placeholder" id="videoPlaceholder">
      <div class="icon">📹</div><div>Point camera at keyboard</div>
    </div>
    <div class="camera-badge warn" id="cameraBadge">Show both hands for fingering feedback</div>
  </div>
</div>
```

### Finger tracking panel HTML
```html
<div class="panel">
  <div class="panel-header"><div class="dot" style="background:var(--purple)"></div>FINGER TRACKING</div>
  <div class="technique-panel" id="techniquePanel">
    <div style="font-size:11px;color:var(--text3);padding:4px 0;">Waiting for vision-audio analysis...</div>
  </div>
</div>
```

### JS state variables
```javascript
let cameraEnabled = false;
let handsTracker = null;
let handTrackerReady = false;
let handTrackerBusy = false;
let lastHandProcessAt = 0;
let handTrackingError = false;
let handLandmarks = [];
let detectedHandCount = 0;
let bothHandsDetected = false;
let lastSentHandState = '';
let lastSentCameraState = '';
let videoInterval = null;
```

### HAND_CONNECTIONS
```javascript
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],[0,17]
];
```

### Key functions to restore
- `updateCameraUi()` — badge + button state
- `sendCameraState()` / `sendHandState()` — sync to server
- `toggleCamera()` / `activateCamera()` — camera on/off
- `initHandTracking()` — MediaPipe Hands setup
- `setHandTrackingState()` / `processHandTracking()` — per-frame tracking
- `clearHandOverlay()` / `drawHandOverlay()` — skeleton rendering
- `showTechniqueReport()` — technique panel UI
- `startSecondaryCamera()` / `stopSecondaryCamera()` — multi-device camera
- Standalone camera mode `?camera=1&room=CODE`

### CSS to restore
- `.video-container`, `.video-container video`, `.video-container canvas`
- `.video-placeholder`, `.video-placeholder .icon`
- `.camera-badge`, `.camera-badge.ready`, `.camera-badge.warn`, `.camera-badge.off`
- `.technique-panel`, `.technique-entry`, `.technique-finger`, `.technique-row`
- `.technique-label`, `.technique-label.eye`, `.technique-label.ear`
- `.technique-obs`, `.technique-suggestion`, `@keyframes techFadeIn`
- `.secondary-camera-preview`, `.secondary-camera-preview video`
