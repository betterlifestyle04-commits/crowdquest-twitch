# CrowdQuest cinematic visual upgrade

Branch: `chatgpt/cinematic-visuals` (based on `crowdquest-3-upgrade`)

## What changed

- Added **original SVG scenery** to the existing React game stage, with layered mountain silhouettes, moon/sky, foreground, animated campfire, Moonlit Pass crystals, a Sunken Bridge, and an Ember Gate portal.
- Added four visually distinct adventurers: sword-bearing Warrior, shield-bearing Guardian, staff-bearing Healer, bow-bearing Scout. Each is dimmed until a real participant selects that role.
- Added a larger animated encounter monster / Ember Lord boss and a server-state-derived threat indicator.
- Player-selected actions activate role-specific **queued-action** visual cues. These represent *submitted commands*, not fabricated resolved damage. The threat meter uses the actual server state after encounter resolution.
- Added special-event atmosphere for Rally and Emberstorm, a victory portal effect, responsive rules, and `prefers-reduced-motion` support.
- Preserved Twitch OAuth, EventSub, the game engine, authoritative server, commands, dashboard controls, and demo chat.
- The dashboard's command deck now shows `TWITCH LIVE` only when the connection is actually reported connected; otherwise it says `DEMO / OFFLINE`.
- The chosen bridge or moonlit environment remains visible during the consequence phase.

## Files

- `apps/web/src/CinematicScene.tsx` — original vector scene.
- `apps/web/src/cinematic-scene.css` — animation and responsive layout.
- `apps/web/src/main.tsx` — integrates the new scene into dashboard, spectator and OBS overlay.

No new npm dependencies, secrets, or external assets have been added.

## Local Windows test

Do not overwrite a modified working tree. From a clean repository:

```powershell
cd C:\Users\anisk\crowdquest-twitch
git fetch origin
git switch --track origin/chatgpt/cinematic-visuals
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

If the branch exists locally, instead use:

```powershell
git switch chatgpt/cinematic-visuals
git pull --ff-only origin chatgpt/cinematic-visuals
```

The private root `.env` should remain ignored and unmodified. Do not paste or commit Twitch secrets. On server restart, Twitch OAuth may need reconnection.

- Dashboard: http://localhost:5173
- Full-screen spectator: http://localhost:5173/spectator
- OBS scene: http://localhost:5173/overlay

### Manual acceptance checklist

1. Verify local dashboard, spectator and overlay render without console errors.
2. In the lobby the campfire is visible, but nonselected role characters are visibly dimmed.
3. Join via actual Twitch chat: `!join`, click Start Quest, then choose `!role warrior`. Verify the Warrior character becomes vivid.
4. On route voting, check the A/B bars. Submit `!path B` and verify Moonlit Pass appears in encounter **and consequence**.
5. During encounter, send `!act attack` as a Warrior. Verify the Warrior's queued-action ring glows and the action is counted. It must not claim damage before the server resolves the phase.
6. Resolve the encounter; check the party health and threat indicators update to the actual server-reported numbers.
7. Proceed to the Ember Gate finale; confirm the boss and portal appear and the result screen shows the correct victory/defeat treatment.
8. Disconnect Twitch and check the command deck says `DEMO / OFFLINE`, not `TWITCH LIVE`.
9. Inspect spectator, dashboard and OBS outputs at 1920x1080 and at narrower window sizes. Check readability, clipping, and reduced-motion.
10. Review `npm audit` findings before public deployment. Do not run forced breaking upgrades blindly.

## Validation limits

The SVG/TSX source received a local TypeScript syntax-transpilation check before upload. No actual browser, unit-test run, remote CI result, or live Twitch test has been performed for **this upgrade branch** from this environment. All items above still need verification before merging into `crowdquest-3-upgrade` or `main`.

This branch is deliberately separate from the user's confirmed Twitch-working baseline tag `crowdquest-working-twitch-baseline`.
