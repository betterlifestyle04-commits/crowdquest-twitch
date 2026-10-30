# CrowdQuest — Storybook RPG UI Upgrade

**Current development branch:** `ui/storybook-v4`  
**Filming release branch after verified integration:** `submission/integrated-crowdquest`

CrowdQuest now has phase-appropriate illustrated chapter panels inspired by cooperative RPGs, rather than showing only one static game scene. These are original, local React/CSS components. All player counts, battle metrics, supplies, threat, outcomes, routes, and top contributors are read from the authoritative game-engine state.

## Real adventure phases

| Phase | New presentation | Verified data |
| --- | --- | --- |
| Lobby | Cinematic prologue, ancient gate invitation, prominent `!join` command | Joined player count |
| Muster / Roles | Four class cards and command hints | Number of participants who have actually selected a class |
| Briefing | Chapter II narrative with Sunken Bridge and Moonlit Pass teasers | No false route claimed before voting |
| Crossroads | Existing animated path voting and glowing leading road | Actual votes, no new overlay covering route choices |
| Encounter | Existing character spells, nameplates and real timers | Server-accepted player actions |
| Aftermath | Narrated recovery panel with health, supplies and threat | Engine-derived first-encounter battle outcome |
| Finale | Existing Ember Lord, spell effects, actual countdown | Accepted commands and server threat |
| Result | New large cinematic victory/defeat chronicle, route, health, player count and top contributor | Actual resolved win/defeat and contribution ranking |

### In-game combat guidance

The four-role HUD now provides exact class-specific action commands while someone is awaiting a combat action:
- Warrior: `!act attack`
- Guardian: `!act shield`
- Healer: `!act heal`
- Scout: `!act scout`

This is a visual improvement only: players still type commands in the connected Twitch channel. The streamer dashboard remains responsible for authenticated host controls.

## Design and accessibility

- Gold-trimmed parchment-like translucent cards, serif chapter titles, illustrated class glyphs and decorative fantasy dividers.
- Different outcome appearance for victory and defeat.
- Result screen replaces the redundant persistent center-phase banner, avoiding two competing central announcements.
- Mobile view collapses secondary narrative/decoration and preserves the essential command/phase information.
- Original ambient animations respect `prefers-reduced-motion`.
- Simulated Showcase previews keep a visible **SIMULATED SHOWCASE** label in addition to existing rehearsal watermarks.
- Missing participants and unresolved outcomes are handled explicitly; the UI never fabricates a champion or win.

## Automatic verification

The Vitest web suite adds tests for empty-lobby onboarding, one-person role selection, chapter transitions, route teasers, actual after-battle statistics, victory and defeat, no players, unresolved outcomes, and simulation labeling. The existing CI still checks dependency advisories, TypeScript, production build and a full quest through HTTP endpoints.

## OBS visual acceptance

**Automated checks cannot verify actual composition, clipping, colors, or readability in OBS.** Before filming:

1. Pull `submission/integrated-crowdquest` after this upgrade is merged and run `npm ci` and `npm run dev`.
2. Open `http://localhost:5173/spectator` and `http://localhost:5173/record`.
3. Inspect the prologue and Muster cards in Showcase/demo mode. Confirm that names and text are readable and the party isn't hidden behind panels.
4. Preview the final result and confirm the central card fits a **1920×1080** Browser Source.
5. Confirm the new panels don't obscure the boss, real command receipts or manual controls.
6. Reset the simulated session. Connect Twitch and record a **genuine** `!join`, `!role`, `!path`, encounter action and finale.
7. Keep the previous known-good release candidate commit `8e3e472c2d60124e6cc9b3a3306b344115a2429e` available if an actual OBS clipping issue is discovered.

## Release safety

Twitch EventSub/OAuth, authorization, game balance, server-side rules, Twitch keys, and the command protocol are untouched in this UI pass. The previous Twitch-working `main` branch is deliberately preserved; do not merge the draft release pull request until real Twitch + OBS validation is complete.
