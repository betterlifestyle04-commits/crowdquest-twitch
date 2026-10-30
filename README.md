# CrowdQuest

> **Hackathon submission build:** The tested integrated version lives on the [`submission/integrated-crowdquest` branch](https://github.com/betterlifestyle04-commits/crowdquest-twitch/tree/submission/integrated-crowdquest). The default `main` branch is an older Twitch-working baseline, not the integrated submission. Review [SUBMISSION.md](SUBMISSION.md), [JUDGE_SETUP.md](JUDGE_SETUP.md) and [VIDEO_STORYBOARD.md](VIDEO_STORYBOARD.md) before submitting.


CrowdQuest is a cooperative Twitch adventure for the Codex x TwitchCon Hackathon. A streamer controls **The Ember Gate** from a live dashboard, viewers play with chat commands, and a transparent OBS browser overlay reflects the authoritative game state instantly.

## What works now

- Real-time dashboard and OBS overlay synchronized through Socket.IO.
- Complete Demo Mode, clearly labeled as simulation, which sends the same commands through the server as Twitch chat.
- A playable cooperative quest: joins, duplicate-safe path votes, action selection, a four-role Formation bonus, shared health/supplies/threat, timed phase transitions, results, and individual contribution totals.
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

## Game rules: The Ember Gate

1. Players join in the lobby with `!join`, then choose a role: Warriors use `!act attack`, Guardians use `!act shield`, Healers use `!act heal`, and Scouts use `!act scout`.
2. The quest advances through a mission briefing, route vote, encounter, consequence, and Ember Gate finale. Each player gets one replaceable vote or role-compatible action per phase.
3. `!path A` selects the dangerous Sunken Bridge (extra supplies, more threat); `!path B` selects the Moonlit Pass (less threat).
4. Warriors reduce threats, Guardians reduce damage, Healers consume shared supplies to restore health, and Scouts lower encounter uncertainty. A round containing all four role actions earns a Formation bonus that weakens the enemy assault. Initial role selection and the first route vote both count as one contribution; changing either choice does not inflate a player's score. The deterministic session seed keeps outcomes reproducible for tests.

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

## Filming day quick guide

See [FILM_TOMORROW.md](FILM_TOMORROW.md) for a short step-by-step OBS, genuine Twitch chat, Codex session, YouTube and Devpost preflight checklist. The game now prevents a late HTTP bootstrap response from overwriting newer live state, and displays a clear connection error/retry screen if the local server cannot be reached.

## In-world character identities and active phase clock

Named adventurers now appear above their actual Warrior, Guardian, Healer or Scout sprite. Shared classes show a participant count; demo participants are explicitly labeled. When a role action is committed, the character's nameplate and the matching spell preparation effect light up.

A visual **phase clock** displays time remaining until the server's real deadline in role selection, route voting, trials and the final battle. Its indicator respects pause, configurable turn duration and urgent final seconds; noninteractive scenes don't invent a timer.

## New real-time battle and viewer feedback

The game now celebrates **accepted Twitch commands** with short, source-labeled in-game hero moments. Rehearsals remain visibly simulated. During battles, each class has a unique original SVG spell-preparation effect (Warrior sword, Guardian shield, Healer aura, Scout eye) which only appears once the server accepts the role-appropriate action. Actual damage, blocking and healing are still shown exclusively from resolved engine data. At crossroads, two illustrated paths highlight the real vote leader.

See [GAMEPLAY_FEEDBACK_UPGRADE.md](GAMEPLAY_FEEDBACK_UPGRADE.md) for the full visual feature descriptions and OBS/testing checklist.

## Immersive RPG game interface

The game now uses a proper **fantasy RPG HUD** in streamer, spectator, OBS overlay and recording views: a context-aware quest mission, chapter tracker, four-role party deck with real ability commitments, and a restrained cinematic phase introduction. Original atmospheric motes, foreground details, role lighting and Ember Gate runes make the world feel less static.

Old overlapping battlefield panels have been consolidated, while full streamer diagnostics remain available below the game. A proper page title and original gate emblem appear in the browser. All status values are read from the actual game engine; demo participants remain visibly marked as simulated.

See [GAME_UI_UPGRADE.md](GAME_UI_UPGRADE.md) for implemented design details, new UI tests and the manual OBS acceptance checklist.

## OBS recording view — real Twitch receipts

To record a competition demonstration, use **[http://localhost:5173/record](http://localhost:5173/record)**. This secret-free 1920×1080 browser layout combines the cinematic adventure with server-confirmed Twitch gameplay commands, current command instructions, party resources, and prominent connection status.

It **never labels demo players as Twitch viewers**: simulated Showcase Studio sessions are explicitly watermarked, and the feed displays only events received from Twitch. The normal streamer dashboard provides a direct **Open recording view** link.

For an OBS Browser Source, set URL to `http://localhost:5173/record`, width `1920`, height `1080`, and fit to screen. Keep the local server running and verify a real Twitch `!join` before recording. The recording view is silent by default and contains no host password/token input. See [OBS_RECORDING_GUIDE.md](OBS_RECORDING_GUIDE.md) for full instructions and privacy guidance.

## Submission readiness (October 30, 2026)

- Full source, cinematic assets, Codex-enhanced cooperative mechanics and read-only OBS/spectator views are available **on this branch**.
- The integrated branch passes `npm ci`, a blocking npm audit, 34 unit tests, TypeScript, production build, and a full HTTP quest smoke test.
- Judge setup and safe demonstration paths are in [JUDGE_SETUP.md](JUDGE_SETUP.md). A draft Devpost writeup is in [SUBMISSION.md](SUBMISSION.md).
- The final submission still requires **your real Codex session ID**, **genuine live Twitch video footage**, a **public or unlisted YouTube video under three minutes**, and clicking **Submit** in Devpost.
- The final integrated version must be manually checked with actual Twitch chat and OBS before claiming end-to-end live verification. A previous baseline was manually tested with Twitch, but that does not certify this newer build.

### Quick Windows update for the integrated branch

```powershell
cd C:\Users\anisk\crowdquest-twitch
git status --short
git fetch origin
git switch --track origin/submission/integrated-crowdquest
npm ci
npm run smoke
npm run dev
```

If already on the integration branch, run `git switch submission/integrated-crowdquest` and `git pull --ff-only origin submission/integrated-crowdquest` instead of `git switch --track`. Preserve local modifications before switching. Your ignored root `.env` should not be overwritten by the branch change.

## Hackathon handoff

Before submission, use the dashboard with a registered Twitch application, capture a sub-three-minute demo showing real chat and the OBS overlay, and record the Codex session ID from the development session. Use only original visual assets in this project and do not include viewer data or secrets in the recording.
