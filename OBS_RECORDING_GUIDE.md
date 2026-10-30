# CrowdQuest — Recording With OBS Studio

## What changed

The integrated game now has a dedicated **recording view**:

**http://localhost:5173/record**

This full-screen layout combines the fantasy game world, party health and resources, current command instructions, and the **actual server-received Twitch gameplay command feed**. The recording page contains no streamer control token input, no Twitch Client Secret, and no host-control buttons. It is intended for video capture and stays silent by default.

The command panel has deliberately conservative labels:

- **TWITCH CONNECTED · AWAITING COMMAND** means the Twitch connection exists, but no accepted chat command has been observed.
- **REAL TWITCH COMMANDS RECEIVED** appears only after the game server records an accepted command with Twitch provenance.
- **TWITCH NOT CONNECTED** or **GAME SYNC DISCONNECTED** warns when the connection or state transport is unavailable.
- **SIMULATED — NOT LIVE TWITCH EVIDENCE** appears during Showcase Studio previews. Only genuine Twitch commands appear in the recording command list; Demo Mode commands are not passed off as live Twitch chat.

The dashboard has an **Open recording view** link next to **Open OBS overlay**.

## First-time OBS setup (Windows)

1. Open **OBS Studio**.
2. In **Settings → Video**, select **Base (Canvas) Resolution: 1920×1080** and **Output (Scaled) Resolution: 1920×1080**. Use 30 FPS if your PC struggles; otherwise 60 FPS is fine.
3. In **Settings → Output → Recording**, choose a location with enough disk space. For crash resilience, use **MKV**, then select **File → Remux Recordings** to convert it into an MP4 for editing/uploading. OBS can also support hybrid MP4 on some recent versions.
4. Start CrowdQuest locally using `npm run dev` and connect Twitch through the streamer dashboard.
5. In OBS, create a Scene named **CrowdQuest Recording**.
6. Add a **Browser Source**. Name it *CrowdQuest — Gameplay and Twitch Commands*. Set URL to **http://localhost:5173/record** and Width **1920**, Height **1080**. Resize the source to fill the canvas with **Transform → Fit to Screen (Ctrl+F)**.
7. Make sure OBS shows the game and the Twitch command panel before recording. If the source is blank, first check `http://localhost:5173/record` in Chrome/Edge and that `http://localhost:3001/health` responds.
8. Optionally add a second scene containing your genuine **Twitch channel chat page** as a Window Capture, and a separate scene for showing the **actual Codex session**. You can switch between scenes during recording or make separate clips to edit later.
9. Before recording, **close or hide credentials**, including Twitch Client Secret, Twitch OAuth tokens, OBS stream key, control token, or private browser tabs. Do not capture `.env` or developer console secret output.
10. In the recording view, send `!join` in **real Twitch chat**, check it appears under "Recent Twitch commands", then start OBS **Start Recording**.
11. Capture the rest of the adventure: `!role`, `!path`, `!act`, resolution and boss result.
12. Stop the recording and play the file locally to confirm that text, chat, and game scene are readable.

**Important:** A local Browser Source needs your computer to keep `npm run dev` and OBS running. Don't shut down your server while recording.

## If the game server disconnects

If the backend is unavailable on initial load, the recording page shows an explicit **Game server not responding** screen with a **Retry connection** button instead of an indefinite spinner. Check that `npm run dev` is still running and `http://localhost:3001/health` responds. The UI discards a late initial HTTP snapshot after it has already received a newer live socket state, preventing an old phase from briefly appearing in your recording.

If the status says **GAME SYNC DISCONNECTED**, do not rely on the displayed game state until live synchronization is restored.

## If you'd rather use Window Capture

Open `http://localhost:5173/record` in Chrome and press **F11** for fullscreen. In OBS, add **Window Capture** for that Chrome window. This is often simpler when browser-source capture behaves unexpectedly. However, never switch the captured window to a secrets page.

## Audio

- The `/record` page is **silent** by design.
- Add narration with your microphone or later during editing.
- The normal spectator page has an optional sound button, but only if explicitly enabled.
- If you want to record Twitch audio, ensure you have the rights to included music and avoid recording other people's private conversations.

## Video compliance

The hackathon video must be under three minutes. Aim for about **2:40** of selected footage, including genuine Twitch chat participation and actual Codex development. `VIDEO_STORYBOARD.md` has a timestamped plan.

**Do not use Showcase Studio footage as if real viewers joined.** Real Twitch chat should be sent to the connected broadcaster's channel and reflected by the command panel.

For stronger evidence, include a brief shot of the actual Twitch chat interface alongside the recording view, not only the in-game command feed. Review the rendered video in a logged-out browser after uploading as Public or Unlisted to YouTube.

## Safeguards

- No private credentials are required in the recording view.
- The command feed shows Twitch display names and gameplay commands received by the server. Tell participants their public screen names could appear in a public demonstration.
- Server command logs are in memory; a backend restart clears the feed and disconnects Twitch until reauthorized.
- If the recording screen says **TWITCH NOT CONNECTED** or **SIMULATED**, don't treat that footage as proof of live Twitch integration.
- The repository's previous Twitch working baseline and draft release PR remain intact.

## Exact branch

This guide accompanies `submission/integrated-crowdquest` after the OBS-recording feature has passed automated checks and been integrated. If reviewing an intermediate commit, the feature branch is `submission/obs-recording`.
