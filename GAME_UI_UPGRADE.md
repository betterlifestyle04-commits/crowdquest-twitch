# CrowdQuest — Game Feel / RPG HUD Upgrade

**Development branch:** `ui/gamefeel-v2`  
**Release candidate after validation:** `submission/integrated-crowdquest`

This visual pass improves the existing game UI without changing Twitch authorization, game balance, API commands, or server combat calculations.

## New experience

**Quest mission panel**
- Custom illuminated fantasy panel in the top-left corner of the battlefield
- Context-specific chapter, location, objective and exact chat command for lobby, role selection, crossroads, battles, aftermath and final results
- Text comes from the real current quest phase, not a random narrative prompt

**Story progression bar**
- Five visually linked chapter milestones (Muster, Journey, Trial, Gate, Chronicle)
- Completed, current and upcoming states based on the game engine

**Role action deck**
- Four distinct illustrated-style role slots for Warrior, Guardian, Healer and Scout
- Live class membership count, missing classes, and locked-in abilities during actual combat
- Real participant readiness counter and quest progress track
- Active abilities glow, unselected classes remain visibly dimmed

**Cinematic clarity**
- Old overlapping HUD fragments are consolidated/hidden within the actual game stage; the streamer diagnostic panels remain elsewhere on the dashboard
- Chapter entrance title fades away after a short animation, leaving the characters and scenery visible
- Victory/defeat retains its cinematic title
- Route voting stays visible, with repositioned cards
- Better text hierarchy, gold-accent game controls and consistent fantasy style throughout dashboard and spectator

**World atmosphere**
- Animated particles, subtle ground markings and lighting beneath role sprites
- Ancient rune circle around the final gate
- Updated browser title, metadata and original SVG favicon
- All optional motion respects `prefers-reduced-motion`

## Viewing modes

- `http://localhost:5173` — streamer dashboard and cinematic battlefield
- `http://localhost:5173/spectator` — larger immersive game view
- `http://localhost:5173/overlay` — transparent OBS game overlay
- `http://localhost:5173/record` — 1920×1080 gameplay plus server-confirmed Twitch command receipts

Only actual server state drives locked abilities, role counts, route votes, combat results and progress. The simulated Showcase Studio remains clearly watermarked. The UI does not claim to play back Twitch messages that weren't received by the backend.

## Clarity and OBS compositing fixes

- The Viewer Ability Deck no longer suggests `!join` during the briefing, aftermath, or completed result phase, when the server would reject it. It gives clear noninteractive-phase guidance instead.
- Only the dedicated `/overlay` route has a transparent document background. The dashboard, spectator and `/record` screens retain their immersive opaque world background.
- Real current health, high threat, complete four-role formation and final outcomes change the world lighting and border accents. No health bars are fabricated.

## Quality checks

- Updated root `npm test` to include the web UI test suite.
- Added server-rendered HUD tests for the lobby, roles, voting, queued battle actions and defeat.
- CI continues to run a blocking npm dependency audit, all tests, TypeScript checking, production build and HTTP full-adventure smoke test.

## Manual visual acceptance before tomorrow's filming

1. Open the streamer dashboard and spectator view. Ensure the new mission panel and four-role deck don't obscure the character silhouettes.
2. Use a local labeled Showcase rehearsal to preview the boss, encounter and result. Check animations and readability only; **do not use this as proof of real Twitch participation**.
3. In OBS, use Browser Source `http://localhost:5173/record`, 1920×1080. Verify no labels are cropped.
4. Return to the real lobby, connect actual Twitch and send `!join`, `!role warrior`, `!path B`, then `!act attack` in the correct phases.
5. Check that role counts and queued indicators update in the HUD when real Twitch messages are accepted.
6. Confirm the intro banner fades away after a few seconds, leaving the game scenery visible.
7. Enable reduced motion in OS settings and verify usable static text and no flashing animations.
8. Check the browser tab shows **CrowdQuest — The Ember Gate** with the original gate icon.
9. If you see any clipping/overlaps in OBS, send a screenshot before recording the final video.

## Rollback and privacy

The older Twitch-tested `main` remains untouched, and the previous release-candidate commit `ec216468da0d3d42708ffca3fe11617f66fa70e2` can be checked out for rollback if the new HUD doesn't suit your recording.

Never commit the private `.env`, Twitch Client Secret, streamer token or stream key.
