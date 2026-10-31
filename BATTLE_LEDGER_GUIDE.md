# CrowdQuest — Battle Ledger & Chronicle UX

The Ember Gate's next visual upgrade gives the game a more deliberate **combat → aftermath → story progression** rhythm. It replaces an overlapping battlefield results card with a single illustrated, engine-authoritative battle ledger inside the proper chapter screen.

## What is new

**Battle ledger** (available only when an authoritative `lastResolution` exists):
- Actual attack power
- Actual shield damage blocked
- Actual recovered HP
- Actual damage received
- Actual number of committed actions
- Explicit Scout/Spirit bonuses only when the engine reports them
- Correct `TRIAL BATTLE REPORT` or `FINAL BATTLE REPORT` heading

This ledger is **inside the aftermath and final victory/defeat chapter cards**; the earlier floating report has been removed so it doesn't cover character sprites, the party's RPG tactical status, or the stage. The cinematic slash, shield, heal and hit replay inside the world remains intact. The ledger does **not** portray the gate-threat gauge as a boss HP bar.

**Quest chronicle**:
- A fantasy-themed short timeline of actual server-recorded quest events; newest first
- Up to five entries on the streamer dashboard and three on the spectator page
- Live scene stays unobstructed; the spectator chronicle is outside the battlefield
- Clearly labels the chronicle as a simulation during Showcase rehearsals
- Empty-state guidance when the quest hasn't started
- No synthetic adventure text or guessed event timestamps

## Performance and accessibility

- Pure React / CSS without new dependencies or new API calls
- Bounded timelines, server-state-only content and React-escaped message text
- Media queries keep the ledger compact on narrow screens
- No auto-playing music or flashing transition; reduced-motion preference is respected
- No change to Twitch OAuth/EventSub, streamer permissions, engine probabilities, or battle outcomes

## Automated verification

New Vitest tests validate battle label selection, resolved values, lack of enemy-HP fabrication, no-player-action cases, result/aftermath integration, missing results, ordering/truncation of chronicle events, and simulation labels. Existing CI continues to check all UI/game tests, a blocking dependency audit, TypeScript, production build, and full-quest HTTP smoke test.

## Manual filming checks

1. Pull `submission/integrated-crowdquest` after the vetted commit lands. Run `npm ci`, `npm run smoke`, and `npm run dev`.
2. Open `http://localhost:5173/spectator`. Verify the battlefield remains unobstructed while the party selects roles, routes and battle actions.
3. From the streamer dashboard, open Showcase Studio and preview the **resolved battle** and final result. Keep the simulation badge visible.
4. Verify the aftermath and finale cards show only the **actual** battle stats once; check all four figures and participant count.
5. At **1920×1080 OBS Browser Source**, confirm the card and tactical bars do not overlap hero sprites, the enemy, Twitch command receipts or the frame edge.
6. Reset the rehearsal, connect real Twitch, and play the full sequence from `!join` to the boss outcome. Confirm the spectator's story timeline updates with actual game events.
7. If any card clips at your video resolution, use the previously tested release commit instead of filming an unreviewed appearance.

The full application has not yet been manually inspected in your actual Windows/OBS environment. Automated tests verify state and build behavior, not pixel-perfect composition.

**Source:** `submission/integrated-crowdquest`. Previous release commit `4631beec2d924a46510074bdcb52096fa419a607` and Twitch-working `main` remain available for rollback.
