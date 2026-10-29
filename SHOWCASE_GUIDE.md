# CrowdQuest — Showcase Studio (simulated rehearsal)

This mode is a **development rehearsal**, not a substitute for the required live Twitch demonstration.

## What it does

The streamer dashboard now includes a **One-click game rehearsal** card with three buttons:

- **Preview encounter** — creates four simulated participants, chooses the safer Moonlit Pass, and queues coordinated Warrior, Guardian, Healer and Scout actions in an actual game-engine encounter.
- **Preview boss fight** — takes the same simulated expedition through the first resolved encounter into the final Ember Lord fight, with coordinated actions queued.
- **Preview final outcome** — calculates the real engine outcome of that seeded demo adventure and displays the result, combat recap and contributions.

The characters are named **Nova [Demo]**, **Arden [Demo]**, **Lyra [Demo]** and **Orion [Demo]**. Each replay uses a new seed for encounter variation. The UI shows **SIMULATED REHEARSAL · NOT TWITCH CHAT** during the rehearsal in dashboard, spectator view and OBS overlay. The panel also displays an explicit warning.

No real viewers are created. The rehearsal does not post anything to Twitch.

## Isolation

While rehearsal is active, incoming real Twitch chat commands are ignored by CrowdQuest's game-command handler. Your Twitch connection itself is not disconnected. To return to real Twitch gameplay, use **Reset to live lobby** in the rehearsal card (or the usual Reset button) and send new `!join` messages from real Twitch chat.

Streamer-authentication requirements apply to rehearsal endpoints just as they do to other host controls. The server validates the requested preview scene rather than accepting arbitrary game state from the browser.

This feature is intentionally for **local evaluation**. It should not be described in a Devpost video as evidence that real Twitch viewers participated.

## Windows setup

From a clean working tree in your existing clone:

```powershell
cd C:\Users\anisk\crowdquest-twitch
git fetch origin
git switch chatgpt/cinematic-visuals
git pull --ff-only origin chatgpt/cinematic-visuals
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

If this branch is not present locally yet, substitute `git switch --track origin/chatgpt/cinematic-visuals` for `git switch chatgpt/cinematic-visuals`.

- Dashboard: http://localhost:5173
- Spectator: http://localhost:5173/spectator
- Overlay: http://localhost:5173/overlay

Start with **Preview boss fight**, then open Spectator Mode for a quick view of the new animated characters, Ember Lord, queued abilities and scene. Click **Preview final outcome** to check the real game-engine result. Use **Reset to live lobby** before testing with real Twitch users.

## Verification

Automated unit tests verify that the rehearsal creates four explicitly labeled simulated users, uses valid roles and server rules, queues the expected actions, enters each requested game phase, and produces a recorded battle outcome at the result stage.

The simulated preview **does not prove Twitch integration**. You must separately use your real channel and verify that a real chat message changes the game, and record genuine live evidence for submission.

A full Windows/OBS browser rendering test remains necessary before merging this draft branch.
