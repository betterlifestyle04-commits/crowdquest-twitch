# CrowdQuest — Cinematic Battle FX & Optional Audio

This document describes the upgrades on `chatgpt/cinematic-visuals`. These are original vector assets and synthetic browser sound effects; no commercial game assets, external sound files, external services, or extra npm packages are required.

## 1. Distinct enemies

The adventure no longer reuses one Ember wraith for every encounter:

| Actual encounter from the game engine | Artwork |
| --- | --- |
| `collapsing bridge` | A broken stone span with falling rubble |
| `bridge raiders` | A trio of armored raiders with a shield-bearing leader |
| `moonshade stalker` | A moonlit four-legged creature with a moving tail and glowing eyes |
| `ember wraith` | A levitating fiery spirit |
| `ember gate` | The large crowned Ember Lord |

The server preserves the **original encounter identity** in `lastResolution.encounter` even when the quest moves into the consequence phase. This ensures the aftermath animation depicts the actual enemy or hazard, not an invented replacement.

## 2. Honest resolved-combat playback

After an encounter or the boss fight resolves, a finite replay effect briefly visualizes values from the server's `BattleResolution` object:

- **ATTACK:** The computed team attack power. It is not labeled or represented as enemy HP damage.
- **BLOCK:** The amount of incoming damage actually absorbed by shields.
- **HEAL:** Health actually restored after the health cap, rather than the requested heal amount.
- **PARTY:** Actual damage the party received.
- **SCOUT:** Bonus provided by a Scout–Warrior combination.
- **NO ACTIONS RECEIVED:** An accurate warning if the phase resolved without player actions.

Attack slashes, shield flashes, healing glows and recoil effects are original SVG/CSS animations. The overlay still displays the persistent resolved battle report for viewers who miss the short effect.

The effect fades out automatically. It is disabled when the viewer has `prefers-reduced-motion: reduce` enabled; numerical battle reports remain available.

## 3. Optional original sound effects

The dashboard and full-screen spectator page include a **♫ Enable sound** control.

- Sound is **off by default**, in each browser tab.
- The listener must click the control; the browser audio engine does not start automatically.
- Short synthesized cues indicate role selection start, crossroads, encounters, the final boss, resolved combat, victory, defeat and streamer special events.
- All cues are original simple oscillator effects generated with Web Audio. No copyrighted songs or sound samples are used.
- A listener can mute at any time. Closing/reopening a tab starts muted again.
- **The read-only OBS overlay stays silent** by default so audio is not unexpectedly introduced into a live stream.
- If Web Audio is unsupported, the audio button reports an error and the game continues normally.

## 4. How to test on Windows

From a clean working tree:

```powershell
cd C:\Users\anisk\crowdquest-twitch
git status --short
git fetch origin
git switch chatgpt/cinematic-visuals
git pull --ff-only origin chatgpt/cinematic-visuals
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

If the branch is not on your PC yet, use `git switch --track origin/chatgpt/cinematic-visuals` instead of the `git switch` and `git pull` lines. Keep your root `.env` private.

1. Open `http://localhost:5173`. In the dashboard, use Showcase Studio to preview an encounter, final boss fight, and final outcome. These previews are **simulated**, watermarked, and must not be presented as real Twitch interactions.
2. Open `http://localhost:5173/spectator` and click **♫ Enable sound**. Confirm you hear the opt-in confirmation cue.
3. While sound is on, use a normal demo or real-Twitch quest to transition through the crossroads, encounter, and boss phases. Check audible cues are quiet enough to avoid competing with speech.
4. On the result screen, verify the actual, server-calculated attack, block, heal, and damage indicators appear briefly. Check persistent battle report numbers are consistent.
5. In your Windows accessibility settings, enable reduced motion, refresh the game, and verify the numbers remain readable even without animation.
6. Check `http://localhost:5173/overlay` in OBS at 1920×1080. No audio should be emitted by this route.
7. Reset Showcase Studio to the live lobby and complete a **real Twitch** session. Confirm that genuine `!join`, `!role`, `!path` and `!act` commands still work.

## Validation limits

CI runs dependency installation, automated tests, TypeScript checks, and a production build for the source on this branch. CI does **not** establish how the animations look on screen, whether the synthetic audio sounds good, or whether OBS renders correctly on the user's PC. Perform those tests separately before merging to `main`.

The existing npm audit advisories need independent investigation and have not been declared fixed.
