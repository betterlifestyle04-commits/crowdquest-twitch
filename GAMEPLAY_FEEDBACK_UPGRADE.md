# CrowdQuest — Character Abilities & Live Player Moments

This update is intended to make CrowdQuest **look and behave like a real cooperative fantasy game** while keeping Twitch as the source of commands and the TypeScript engine authoritative.

## What appears onscreen

### 1. Server-accepted viewer moments

When the backend accepts `!join`, `!role`, `!path`, or a matching `!act` command, the game can briefly display a source-labeled visual acknowledgement beside the battlefield. This shows the viewer's public display name, a clear action label and an icon.

- The moment appears for at most about **4.5 seconds** from the server's timestamp, never indefinitely.
- It appears only during phases in which that command is legal; old commands are not replayed across new scenes.
- Rejected and malformed commands do not get celebratory effects.
- No command is shown if the game feed is disconnected.
- `TWITCH CHAT` denotes a real Twitch-sourced event; **`SIMULATED DEMO`** is used for test/demo participation.
- Actions are described as **readied / committed**, not as damage already dealt. Real results still come from the engine's combat resolution.
- A paused or result screen does not fake live action; the existing pause and result overlays remain primary.

### 2. Four real-time character abilities

The SVG world now displays different effects around the corresponding adventurer **only when an appropriate role action is committed in the encounter or finale**:

| Role | Readied effect | Actual accepted command |
| --- | --- | --- |
| Warrior | Glowing raised sword and blade arc | `!act attack` |
| Guardian | Raised magical shield | `!act shield` |
| Healer | Growing healing cross and aura | `!act heal` |
| Scout | Focused scouting-eye glyph | `!act scout` |

The effects are not fake damage. Once the host or timer resolves combat, existing **server-derived** numbers and aftermath animations tell the result. All four illustrations are original inline SVG; they do not require image downloads or third-party libraries.

### 3. Real route-choice scenery

During the crossroads phase, the landscape includes two distinct roads and illustrated A/B direction markers. The brighter road reflects the **actual current route vote lead**. A tied vote doesn't artificially highlight either route. The established vote bar remains visible and remains the source of numeric vote counts.

### 4. Accessibility and reliability

- Respect the OS `prefers-reduced-motion` setting for queued effects and player moment entrance.
- New player names are rendered as escaped React text and are length-limited by the existing server logger.
- New UI is present on dashboard, spectator, recording view and full-screen overlay through the same scene component.
- The original Web Audio stays muted unless a viewer explicitly enables it.
- No Twitch OAuth/secret handling or game mechanics are changed.

## Manual visual test for tomorrow

1. Update to the exact integrated release branch, run `npm ci && npm run dev`.
2. Open `http://localhost:5173/spectator` and `http://localhost:5173/record`.
3. In **Showcase Studio**, preview a test battle and confirm its simulation watermark. This is visual review **only**, not proof of real Twitch.
4. Reset. Connect Twitch and type `!join` in genuine Twitch chat. Look for the moment banner labeled **TWITCH CHAT** and the server-confirmed receipt in `/record`.
5. Type `!role guardian` during role selection, `!path B` at the crossroads, then `!act shield` in combat. Confirm the shield visual appears before resolution, and the actual blocked amount after resolution.
6. If you play with Warrior/Healer/Scout instead, verify the corresponding action and effects, never generic attack visuals.
7. Check OBS at **1920×1080** for readable banners and no clipping.
8. Try reduced-motion settings if available.
9. For the hackathon demonstration, show **real Twitch chat** as well as a short shot of actual Codex work. Don't rely on demo-only footage.

## Verification

The game-feel branch adds Vitest tests for accepted-command recency, source labels, rejected commands, phase bounds, empty-state rendering and role-correct action VFX. The main pipeline continues to run TypeScript checks, unit tests, production build, dependency audit and HTTP quest smoke testing.

The game has not been manually inspected in your local OBS session. GitHub Actions confirms code/test integrity only. Your previously manually verified Twitch baseline remains in `main`.
