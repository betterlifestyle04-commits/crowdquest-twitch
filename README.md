# CrowdQuest

CrowdQuest is a cooperative Twitch adventure for the Codex x TwitchCon Hackathon. A streamer controls **The Ember Gate** from a live dashboard, viewers play with chat commands, and a transparent OBS browser overlay reflects the authoritative game state instantly.

## What works now

- Real-time dashboard and OBS overlay synchronized through Socket.IO.
- Complete Demo Mode, clearly labeled as simulation, which sends the same commands through the server as Twitch chat.
- A playable cooperative quest: joins, duplicate-safe path votes, action selection, shared health/supplies/threat, timed phase transitions, results, and individual contribution totals.
- Validated chat parser plus game-mechanics tests.
- Credential-gated Twitch OAuth callback and EventSub WebSocket client for `channel.chat.message`; no token is exposed to the browser.

## Quick start

Requires Node.js 22+ and npm 10+. The repository includes `.nvmrc`; use `nvm use` where available. The Node server resolves the root `.env` file deterministically, regardless of the npm workspace command used to start it.

```bash
cp .env.example .env
npm install
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` for the streamer dashboard and `http://localhost:5173/overlay` in an OBS Browser Source. The overlay uses a transparent page background; set its size to 1920×1080 in OBS. For a full-screen, opaque game presentation useful for demos and local capture, open `http://localhost:5173/spectator`.

Use **Demo Mode** to enter `!join`, choose `!role warrior`, `!role guardian`, `!role healer`, or `!role scout`, then vote and act. Start the quest from the dashboard, then either wait for phase timers or click **Advance phase**. Demo names are visibly marked `[Demo]` in the game log and never presented as Twitch users.

Before a quest, the streamer can choose **Relaxed**, **Standard**, or **Heroic** difficulty and set each interactive phase to 10–120 seconds. These settings lock after the game begins. The streamer can pause and resume active timed phases without consuming the remaining time.

During an active quest, the streamer can trigger protected special events: **Rally** grants 8 party health and one supply; **Emberstorm** adds 4 threat. Both are shown to the audience in the overlay and have a 15-second server-side cooldown.

```bash
npm test
npm run typecheck
npm run build
```

## Gameplay & visual upgrades (draft branch)

The cinematic visual branch adds an original illustrated world, distinctive role avatars, the Ember Lord and a server-derived battle-resolution panel. During a battle, submitted actions glow as **queued**; after each round, the overlay displays the **actual resolved** attack, blocked damage, restored health and damage taken. These are not fabricated effects.

**Solo play:** a lone active adventurer receives an Ember Spirit companion (+7 attack power when submitting a valid battle action). It appears in the scene, and the battle recap identifies its contribution. Every role can finish the safer route in the deterministic test scenario; harder settings and risky routes still have genuine failure risk.

**Command acceptance:** Demo Mode now distinguishes an accepted command from a rejected one and explains wrong phases, missing roles, invalid abilities, duplicate joins and cooldowns. Twitch messages use the same authoritative rules but are not automatically echoed into Twitch chat.

**Results:** a resolved final encounter records 100% journey completion whether the party wins or loses; victory and defeat remain separate outcomes. Resetting the quest increments the replay seed for new encounter variation. Changes to the quest remain local to the server and are propagated to dashboard, spectator view and overlay.

## One-click Showcase Studio (development-only)

Use the new **One-click game rehearsal** card to preview a four-player encounter, Ember Lord boss fight or completed quest. It uses the real game engine but **only simulated participants with [Demo] labels**. The dashboard, spectator page and overlay display a prominent `SIMULATED REHEARSAL` watermark. Real Twitch chat commands are temporarily ignored until you press **Reset to live lobby**. This protects the user from confusing a simulated preview with genuine Twitch integration.

The full streamer dashboard now also displays the end-of-game **Community chronicle** with a **Copy quest recap** button. It includes outcome, route, top contributors and highlights, explicitly labeling simulated and mixed sessions. If clipboard access is unavailable, a text field appears for manual copying. This is intended for streamer notes, not as a substitute for recording a real Twitch test.

See [SHOWCASE_GUIDE.md](SHOWCASE_GUIDE.md) for setup and verification.

## Game rules: The Ember Gate

1. Players join in the lobby with `!join`, then choose a role: Warriors use `!act attack`, Guardians use `!act shield`, Healers use `!act heal`, and Scouts use `!act scout`.
2. The quest advances through a mission briefing, route vote, collapsing-bridge encounter, consequence, and Ember Gate finale. Each player gets one replaceable vote or role-compatible action per phase.
3. `!path A` selects the dangerous Sunken Bridge (extra supplies, more threat); `!path B` selects the Moonlit Pass (less threat).
4. Warriors reduce threats, Guardians reduce damage, Healers consume shared supplies to restore health, and Scouts lower encounter uncertainty. The deterministic session seed keeps outcomes reproducible for tests.

The server validates phase eligibility and participant identity, makes all phase transitions, and rate-limits each chatter to one accepted command every 800 ms. In production, dashboard and Demo Mode controls require `STREAMER_CONTROL_TOKEN` entered in the in-page streamer control field. It is sent as an authorization header and is never compiled into the frontend or stored in the repository. Read-only state and the OBS overlay have no control authority.

## Twitch setup (manual, required for live chat)

This is intentionally not faked: Demo Mode is available without credentials, while the **Connect Twitch** button reports an error until a real application is configured.

1. In the [Twitch Developer Console](https://dev.twitch.tv/console/apps), register an application.
2. Add `http://localhost:3001/auth/twitch/callback` as its OAuth Redirect URL (or your exact HTTPS production callback).
3. Copy `.env.example` to the root `.env` and enter `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, and the matching `TWITCH_REDIRECT_URI`. Set a long random `STREAMER_CONTROL_TOKEN` for production (`openssl rand -hex 32`). Keep `.env` private; it is gitignored.
4. Restart the server and click **Connect Twitch**. Sign in as the broadcaster. OAuth state is cryptographically random and validated server-side.
5. On EventSub WebSocket welcome, the server creates a `channel.chat.message` subscription with `broadcaster_user_id` and `user_id` both set to the authenticated broadcaster's numeric Twitch ID. Incoming Twitch message text is passed to the same parser and engine as Demo Mode. The dashboard changes to **Live chat connected** only after that subscription succeeds.

The exact local callback is `http://localhost:3001/auth/twitch/callback`; it is consistent in `.env.example`, the OAuth request, and the server route. The OAuth request asks for `user:read:chat`, which supports the authenticated broadcaster reading their own chat. For a bot/moderator different from the broadcaster, review Twitch's current authorization conditions and adapt the `user_id` condition before testing. The dashboard exposes authorization, connection, disconnect, subscription-revocation, and EventSub errors; no tokens or secrets are sent to the browser. This repository makes no claim that live Twitch was tested without supplied credentials.

## Structure

```text
apps/server       Express, Socket.IO, OAuth/EventSub adapter
apps/web          React/Vite/Tailwind dashboard and OBS overlay
packages/shared   Typed game engine and chat parser with Vitest tests
```

## Hackathon handoff

Before submission, use the dashboard with a registered Twitch application, capture a sub-three-minute demo showing real chat and the OBS overlay, and record the Codex session ID from the development session. Use only original visual assets in this project and do not include viewer data or secrets in the recording.
