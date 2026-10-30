# CrowdQuest — Film Tomorrow: 10-Minute Preflight

This checklist is for the **Codex x TwitchCon hackathon recording**. Use the current integrated branch, not `main`.

## 1. Start the verified game

From a Windows PowerShell terminal:

```powershell
cd C:\Users\anisk\crowdquest-twitch
git status --short
git fetch origin
git switch submission/integrated-crowdquest
git pull --ff-only origin submission/integrated-crowdquest
npm ci
npm run smoke
npm run dev
```

If `git switch` reports the branch is missing, instead run `git switch --track origin/submission/integrated-crowdquest`. **Preserve any uncommitted changes shown by `git status --short` before switching.**

Keep `.env` private. Do not record that file, your OAuth callback URLs containing temporary authorization codes, Twitch secrets or OBS stream keys.

## 2. Set up OBS

- Settings → Video: **1920 × 1080**, **30 FPS** (or 60 if your PC handles it).
- Settings → Output → Recording: choose **MKV** for safer capture; after recording use **File → Remux Recordings** for MP4.
- Sources → **Browser Source**: `http://localhost:5173/record`, width **1920**, height **1080**. Fit to screen with **Ctrl+F**.
- Open the streamer dashboard separately at `http://localhost:5173` for host controls. Do not expose your control token on screen.
- If the Browser Source appears blank, first open `http://localhost:5173/record` in Chrome, check `http://localhost:3001/health`, and refresh the OBS source.

## 3. Prove real Twitch chat, not rehearsal

- On the dashboard, **Reset** the quest; Showcase Studio must not be active.
- Connect Twitch and confirm the recording screen says **TWITCH CONNECTED · AWAITING COMMAND**.
- Send **`!join`** in genuine Twitch chat, not Demo Mode. The recording page must then say **REAL TWITCH COMMANDS RECEIVED** and show the command with **ACCEPTED**.
- If it shows **TWITCH NOT CONNECTED**, **GAME SYNC DISCONNECTED**, or **SIMULATED**, **do not use that footage as proof of real Twitch integration.**
- Show the actual Twitch chat window briefly so judges can see the message originated on Twitch.

## 4. Capture one complete adventure

Use these in the *correct phases*, letting the host advance with the dashboard:

1. In the lobby: `!join`.
2. After Start Quest / during Muster: `!role warrior` (or another role).
3. At the crossroads: `!path B`.
4. During the encounter: `!act attack` for Warrior (Guardian: shield; Healer: heal; Scout: scout).
5. At the Ember Lord finale: submit the correct `!act` again.
6. Record the real final outcome and community contribution summary.

Turn off **Smart Host** for your first full recorded run so you can control scene timing. Keep Showcase Studio inactive.

## 5. Record actual Codex use

Capture the real Codex session where the game was developed, a prompt/patch/test result, and obtain the session ID using `/status`. Do not invent the session ID, and never reveal passwords or tokens in footage.

## 6. Edit and submit

- Follow `VIDEO_STORYBOARD.md`, aiming for ~**2:40** and **strictly under 3:00**.
- You do **not** need to show your face. Use voice-over or captions.
- Upload to **YouTube** as Public or Unlisted and open the URL in a logged-out browser to verify access.
- Paste the YouTube link, Codex session ID and the exact repository URL into Devpost.
- Confirm Devpost says **Submitted** rather than **Draft**.

**Competition deadline:** November 2, 2026 at **23:00 Oslo time** (2:00 PM PST), subject to the organizer’s official Devpost page.

**Repository:** https://github.com/betterlifestyle04-commits/crowdquest-twitch/tree/submission/integrated-crowdquest

**Important:** Automated tests verify code paths, not actual streaming, Twitch authorization or how OBS looks on your PC. Tomorrow’s real recording is the last meaningful acceptance test.
