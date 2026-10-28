# CrowdQuest

CrowdQuest is a cooperative Twitch adventure for the Codex x TwitchCon Hackathon. A streamer controls **The Ember Gate** from a live dashboard, viewers play with chat commands, and a transparent OBS browser overlay reflects the authoritative game state instantly.

## What works now

- Real-time dashboard and OBS overlay synchronized through Socket.IO.
- Complete Demo Mode, clearly labeled as simulation, which sends the same commands through the server as Twitch chat.
- A playable cooperative quest: joins, duplicate-safe path votes, action selection, shared health/supplies/threat, timed phase transitions, results, and individual contribution totals.
- Validated chat parser plus game-mechanics tests.
- Credential-gated Twitch OAuth callback and EventSub WebSocket client for `channel.chat.message`; no token is exposed to the browser.

## Quick start

Requires Node.js 20+ and npm 10+.

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` for the streamer dashboard and `http://localhost:5173/overlay` in an OBS Browser Source. The overlay uses a transparent page background; set its size to 1920×1080 in OBS.

Use **Demo Mode** to enter `!join`, `!path A`, `!path B`, and `!act attack`, `!act shield`, or `!act heal`. Start the quest from the dashboard, then either wait 30 seconds per phase or click **Resolve phase**. Demo names are visibly marked `[Demo]` in the game log and never presented as Twitch users.

```bash
npm test
npm run typecheck
npm run build
```

## Game rules: The Ember Gate

1. Players join in the lobby with `!join`.
2. During route selection, each player has one replaceable vote: `!path A` selects the dangerous Sunken Bridge (extra supplies, more threat); `!path B` selects the Moonlit Pass (less threat).
3. During action selection, each player picks one replaceable action: `!act attack`, `!act shield`, or `!act heal`.
4. Attacks reduce threat, shields absorb damage, heals spend shared supplies and restore health. The party wins by reducing the encounter to a manageable threat while keeping health above zero.

The server validates phase eligibility and participant identity, makes all phase transitions, and rate-limits each chatter to one accepted command every 800 ms. Browser clients only render state and call privileged dashboard controls in this prototype; deploy behind streamer authentication before exposing those controls publicly.

## Twitch setup (manual, required for live chat)

This is intentionally not faked: Demo Mode is available without credentials, while the **Connect Twitch** button reports an error until a real application is configured.

1. In the [Twitch Developer Console](https://dev.twitch.tv/console/apps), register an application.
2. Add `http://localhost:3001/auth/twitch/callback` as its OAuth Redirect URL (or your exact HTTPS production callback).
3. Copy `.env.example` to `.env` and enter `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, and the matching `TWITCH_REDIRECT_URI`. Keep `.env` private; it is gitignored.
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
