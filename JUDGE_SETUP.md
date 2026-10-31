# CrowdQuest — Judge Setup and Test Guide

**Submission branch:** `main`

**Repository:** https://github.com/betterlifestyle04-commits/crowdquest-twitch

## Prerequisites

Node.js **22+** and npm **10+**. Windows, macOS or Linux with a modern browser. OBS is optional for overlay evaluation.

## Quick start (safe, simulated demo; no Twitch secrets required)

```bash
git clone https://github.com/betterlifestyle04-commits/crowdquest-twitch.git
cd crowdquest-twitch
npm ci
npm test
npm run typecheck
npm run build
npm run smoke
npm run dev
```

Open the hosted, explicitly simulated gallery at https://crowdquest-ember-gate.onrender.com/, or run the local project below. The hosted gallery **is not evidence of real Twitch chat**. See [PUBLIC_WEBSITE_GUIDE.md](PUBLIC_WEBSITE_GUIDE.md) for service details.

Open:
- **Streamer dashboard:** http://localhost:5173
- **Public scene gallery:** http://localhost:5173/showcase
- **Full-screen spectator:** http://localhost:5173/spectator
- **Transparent OBS overlay:** http://localhost:5173/overlay
- **Server health:** http://localhost:3001/health

There is no paid service required to run the simulated demo.

On the dashboard, use **Showcase Studio** and select **Preview boss fight** to see an explicitly simulated four-player party. All simulated names are marked `[Demo]`, the UI is visibly watermarked, and live Twitch input is intentionally disabled during the rehearsal. Use **Reset to live lobby** to leave simulation mode.

Alternatively, use manual Demo Mode commands in each eligible phase. Host controls can advance phases or you can allow timers.

## Test a live Twitch connection

1. Register a Twitch developer app at https://dev.twitch.tv/console/apps.
2. Add OAuth redirect `http://localhost:3001/auth/twitch/callback`.
3. Copy `.env.example` to `.env` at the repository root, with `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_REDIRECT_URI`, and optionally `STREAMER_CONTROL_TOKEN`. **Never commit or show this file.**
4. Restart `npm run dev`; open the dashboard; click **Connect Twitch** and authorize as the broadcaster.
5. Verify the connection status and that a real `!join` arrives in **Recent game commands** marked `TWITCH`.
6. Run a full quest: `!join` → host Start → `!role warrior` → route vote `!path B` → `!act attack` during encounter and boss phases.
7. Observe the dashboard, spectator and OBS overlay update together. Use an OBS Browser Source at 1920×1080.

The dashboard has optional Smart Host automatic progression, off by default. Turn it on only when comfortable with the normal manual game flow.

## Safety and architecture

- Twitch access/refresh tokens and the Twitch Client Secret remain in the server process only.
- `.env` is ignored by Git.
- Server-authoritative game engine validates all gameplay transitions.
- Streamer control operations require a configured `STREAMER_CONTROL_TOKEN` in production.
- Simulation is visually differentiated from real Twitch participation.
- Game/session and OAuth state are **in-memory**: restarting the backend resets the quest and requires reconnecting Twitch.
- This project is optimized for local browser/OBS use. Do not expose the local development server directly to the internet.

## Verified in GitHub Actions

`npm ci`, `npm audit --audit-level=moderate`, `npm test`, `npm run typecheck`, `npm run build`, and `npm run smoke`.

The HTTP smoke test launches isolated backend/web servers without a Twitch connection; it cannot verify real Twitch authorization, actual OBS visual rendering, or the uploaded demonstration video. See [SECURITY_AND_RELEASE.md](SECURITY_AND_RELEASE.md).

## Troubleshooting

- **Credentials not configured:** Confirm root `.env` exists and the backend was restarted.
- **Twitch authorized but no messages:** Confirm you authorized the broadcaster account and reconnect via the dashboard.
- **Commands rejected:** Verify the current phase and matching role action. The Recent game commands panel shows rejection reasons.
- **Host action unauthorized:** Enter `STREAMER_CONTROL_TOKEN` in the dashboard token field.
- **Port already in use:** Stop other local CrowdQuest processes running on ports 3001/5173.
- **Simulated viewers shown:** Reset the quest before demonstrating genuine live Twitch chat.

The hosted gallery is optional for local game evaluation; it is distinct from the genuine Twitch gameplay demonstration. A public service URL must be verified independently before adding it to Devpost.
