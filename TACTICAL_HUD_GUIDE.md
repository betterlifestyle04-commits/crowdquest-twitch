# CrowdQuest — Tactical Game HUD v5

## What changed

A new integrated bottom-of-game tactical display makes CrowdQuest easier to follow as a **cooperative fantasy RPG**, rather than relying on streamer-only diagnostic cards.

### Party vitals

- **Party health:** a green, amber or critical-red bar based on true shared `health / maxHealth`; the exact numeric health remains readable
- **Gate threat:** a red danger bar displaying the real `threat` number; the bar uses a visual 30-point reference scale, **not enemy health and not a hard game cap**
- **Shared supplies:** the actual available healing supply count
- **Quest progression:** unchanged and still derived from the game engine
- **Responsiveness:** compact numbers and readable stacked information on narrower browser/OBS layouts

### Synergy preparation (not fake damage)

During encounters and the boss finale, the panel identifies **accepted player actions** and highlights combinations:

1. **Scout + Warrior combo:** appears only when the appropriate Scout and Warrior commands are both currently committed. The scout's server-calculated benefit is shown after resolution in the existing report.
2. **Full formation:** appears only when all four different class actions (Warrior attack, Guardian shield, Healer heal, Scout scout) are committed in the same round. Formation reduces danger at server resolution.
3. **No active combination:** a neutral teamwork prompt appears, not a false ready/boss-defeated badge.

The panel validates action-to-role consistency before recognizing a combo, even if it encounters a malformed incoming snapshot. The actual effect remains calculated by `packages/shared/src/index.ts`; frontend status is only a visualization.

### Genuine party-health reaction

When the running server pushes a changed party HP value, the battlefield briefly displays a red **−N HP** effect on loss or a green **+N HP** effect on recovery.

This feedback:
- Shows **net HP changes**, not invented per-enemy damage numbers
- Does not fire on initial load, unchanged state, resets, a new seed, or invalid numerical data
- Stops after ~1.4 seconds and never intercepts player/host controls
- Respects `prefers-reduced-motion`: the full-screen vignette is removed and the number stays static briefly

## Quality controls

New web tests validate correct resource numbers, health-bar scaling, oversized threat values, true Scout–Warrior/full-formation combinations, invalid role/action pairing, server-health changes, and reset behavior.

The main CI runs dependency security auditing, all unit/UI tests, TypeScript checking, production build, and HTTP full-quest smoke test.

## Manual filming check

1. Pull `submission/integrated-crowdquest` after the new code has been safely merged.
2. Run `npm ci`, `npm run smoke`, then `npm run dev`.
3. Open `http://localhost:5173/spectator` and `http://localhost:5173/record` to review the new bottom RPG resource display at **1920×1080**.
4. Use a clearly labeled **Showcase** battle to verify four different abilities visually. This is a rehearsal, not evidence of real Twitch chat.
5. Reset the game, connect genuine Twitch chat, and execute correct `!join`, `!role`, `!path` and `!act` commands.
6. Confirm the synergy label appears only once the right combination of roles has accepted actions.
7. Advance the battle and check any damage/recovery effect matches the server's actual resulting party HP.
8. If the tactical panel overlaps sprites or stage text in OBS, use the previous release candidate commit rather than filming an unreviewed layout.

**This UI pass does not change Twitch OAuth/EventSub, server authorization, game balance or the game engine.** The previous Twitch-verified `main` remains untouched.

Automated CI verifies functionality, not final Windows browser/OBS visual quality.
