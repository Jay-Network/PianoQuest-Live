# PianoQuest Live — User Manual

## What is PianoQuest Live?

PianoQuest Live is an AI piano coach that listens to your playing, watches your hands, and gives real-time feedback through natural conversation. It uses Google's Gemini AI with live audio, video, and MIDI input.

## Quick Start (Single Device)

1. Open `https://pianoquest-live-tydxja77iq-uc.a.run.app` in Chrome
2. Click **Start Session**
3. Allow microphone access when prompted
4. Start talking or playing — Gemini will respond by voice

## Multi-Device Setup (Recommended)

PianoQuest works best with 3 devices, each handling a different role:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🖥️ Computer (Primary)     — MIDI from piano   │
│   📱 iPad (Secondary)       — Mic + Speaker     │
│   📱 iPhone (Secondary)     — Camera at piano   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Step 1: Start the Primary Device

Open the app URL on your **computer** (the device connected to the digital piano via USB/MIDI).

Click **Start Session**. You'll see:
- A **room code** (e.g. `X29N`) in the status bar
- A **QR** button next to "Copy Link"
- A **Device Manager** panel showing connected devices

### Step 2: Connect Secondary Devices

**Option A — QR Code (easiest):**
Click the **QR** button on the primary device. Point your iPad/iPhone camera at the QR code — it opens the join URL automatically.

**Option B — Copy Link:**
Click **Copy Link** on the primary device. Share the URL to your other devices (AirDrop, message, etc.).

**Option C — Manual:**
On the secondary device, open: `https://[app-url]/?room=CODE`
Replace `CODE` with the room code shown on the primary device.

### Step 3: Assign Roles

On the primary device, the **Device Manager** shows all connected devices. Each device can have one or more roles:

| Role | What it does |
|------|-------------|
| **MIC** | Sends your voice to Gemini (speech input) |
| **CAM** | Sends camera video to Gemini (hand tracking) |
| **MIDI** | Sends piano MIDI data to Gemini (note analysis) |

**Rules:**
- Each role can only be on **one device at a time**
- Assigning a role to one device removes it from the other
- The primary device starts with MIC role by default

### Recommended Role Assignment

| Device | Role | Placement |
|--------|------|-----------|
| Computer | MIDI | Connected to digital piano via USB |
| iPad | MIC | In front of you (for conversation) |
| iPhone | CAM | Propped up behind the piano, pointing at your hands |

## What You'll See

### On the Primary Device (Computer)
- **Piano Roll** — waterfall display of notes played (driven by MIDI)
- **Grand Staff** — standard music notation showing active and recent notes
- **Keyboard** — virtual keyboard reflecting MIDI input
- **Device Manager** — connected devices and their roles
- **Coaching Focus** — current tip from the AI coach
- **Finger Tracking** — vision + audio correlation reports

### On Secondary Devices (iPad/iPhone)
- Audio playback from Gemini (you hear the coach on all devices)
- Role indicator showing which role is active
- Camera preview (on the camera device)

## Panels

### Coaching Focus
When Gemini gives you a specific, actionable tip, it appears here as a card. Example:
> "Curve your 3rd finger more — you're playing flat"

### Finger Tracking
When Gemini correlates what it **sees** (hand position) with what it **hears** (sound quality), it reports the connection. Example:
> 👁️ "Thumb is collapsing at the joint"
> 👂 "Uneven tone on the ascending scale"
> 💡 "Support the thumb from underneath — imagine holding a small ball"

### Piano Roll
A scrolling waterfall view of your playing:
- **Colors** = dynamics (blue = soft, red = loud, purple = very loud)
- **Bar length** = note duration
- **Faded bars** = pedal sustain (finger released but pedal held)
- **Beat grid lines** = aligned to the BPM slider

### Grand Staff
Standard music notation (treble + bass clef):
- Active notes shown as filled circles with stems
- Recent notes scroll to the right and fade
- Ledger lines for notes above/below the staff
- Sharp accidentals shown for black keys

### Keyboard
Visual keyboard at the bottom reflecting which keys are pressed:
- Colors match the dynamics palette
- Dimmed colors = pedal-sustained notes

## Controls

| Button | What it does |
|--------|-------------|
| **Start Session** | Connects to Gemini and starts the coaching session |
| **Stop** | Ends the session |
| **Camera On/Off** | Toggle camera (only visible on camera-assigned device) |
| **QR** | Show/hide QR code for secondary device onboarding |
| **Copy Link** | Copy the room join URL to clipboard |
| **BPM slider** | Adjust beat grid overlay on the piano roll |
| **MIDI input dropdown** | Select which MIDI device to use |
| **Refresh MIDI** | Rescan for MIDI devices |

## Tips

- **Don't speak first** — Gemini waits for you. Start playing or say hello.
- **Keep responses short** — Gemini gives 1-2 sentences at a time, like a teacher next to you.
- **Camera angle matters** — point the camera at your hands from above or behind for best tracking.
- **MIDI is more reliable than audio** — for note accuracy, always connect MIDI if possible.
- **Pedal is tracked** — sustain pedal (CC64) is shown in the waterfall and keyboard.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Error" on start | Make sure you're using **HTTPS** (not http://). Mic requires HTTPS on non-localhost. |
| Room code keeps changing | Check that the Gemini model is available. Restart the server. |
| No sound from Gemini | Check device volume. Gemini audio plays on all connected devices. |
| MIDI not detected | Click "Refresh MIDI". Make sure piano is connected via USB and browser supports Web MIDI (Chrome). |
| Camera won't activate | Allow camera permission in browser settings. Must be on HTTPS. |
| Secondary can't connect | Make sure the room code is correct and the primary session is still active. |

## Technical Requirements

- **Browser:** Chrome (required for Web MIDI API)
- **Connection:** All devices must have internet access
- **MIDI:** USB-connected digital piano (for MIDI role)
- **Camera:** Any device camera (rear-facing recommended for hand view)
- **Microphone:** Built-in or external mic (for speech to Gemini)
