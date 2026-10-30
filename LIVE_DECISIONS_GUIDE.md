# CrowdQuest — Live Decisions and Recording UX v7

This version focuses on one of the most important things for a genuine Twitch multiplayer experience: **making viewer decisions immediately visible** to people watching the game.

## In-world crossroads voting

At the `path` phase, the old compact vote widget is replaced with two designed route cards, integrated directly into the battlefield:

- **Sunken Bridge — A:** `!path A`. The engine grants +2 supplies and adds +4 route threat before encounter-specific modifications.
- **Moonlit Pass — B:** `!path B`. The engine reduces route threat by 2 before encounter-specific modifiers.
- Live vote counts, vote percentages, provisional leader, and number of adventurers who have yet to vote.
- Clear **No votes yet** and **Vote tied** states.
- The exact engine rule is visible: **ties resolve to Route A** (also applies when nobody votes).
- A vote remains provisional until the host advances or the phase ends; viewers can update their existing vote before then.
- The cards deliberately aren't clickable: Twitch chat is the source of interaction and the server validates every command.

The board reads `state.pathVotes` and `state.players` and disappears immediately outside the voting phase. It never invents votes or presents a provisional leader as an already chosen route.

## Party-readiness progress in the OBS recording layout

The `http://localhost:5173/record` view now also shows a small **party participation progress meter** under the current-phase command:

- During role selection: players who have chosen a role, out of joined players.
- During the route vote: ballots cast out of joined players.
- During encounters and the finale: accepted combat actions out of eligible, assigned-role players.
- The progress switches to **THE PARTY IS READY** only when the engine's exact phase-readiness rule is satisfied.
- Empty sessions show **AWAITING ADVENTURERS** rather than fake completion.
- Noninteractive phases don't display an irrelevant meter.
- The existing source-verified Twitch command receipts and explicit simulation watermark remain unchanged.

The progress is purely read-only presentation and does not trigger auto-advancement or publish anything to Twitch.

## UI and accessibility

- Original fantasy styling with differently accented paths, clear commands, and provisional vote animations.
- Scaled for the dashboard, spectator and OBS recording game stage.
- Percentage bars and readiness progress use accessible text and ARIA labels.
- Reduced-motion preferences disable the percentage transitions.
- No new npm dependencies or secrets; no Twitch/OAuth/EventSub or game-engine changes.

## Automated and manual acceptance

New Vitest suites cover zero votes, tie and no-vote tie-breaks, B/A leadership, changed votes, correct path consequences, empty parties, readiness before and after role selection, votes, and role-valid combat actions.

The GitHub workflow performs dependency audit, test suite, TypeScript typecheck, production build, and the full HTTP quest smoke test. **Automated success does not certify pixel-perfect appearance in OBS**.

Before filming:
1. Update the `submission/integrated-crowdquest` branch once validated, then run `npm ci` and `npm run dev`.
2. Open `http://localhost:5173/spectator` and `http://localhost:5173/record` at a **1920×1080** OBS Browser Source.
3. For appearance checks, use clearly labeled simulated rehearsal. Confirm the two path cards and the readied-meter fit without covering hero sprites or route markers.
4. Reset the rehearsal and connect real Twitch. Test `!join`, `!role`, `!path A`, `!path B`, and relevant `!act` commands at the right phases. Confirm the server accepts them and updates counts.
5. Capture actual Twitch chat alongside the recording view; demo-only commands must not be described as real Twitch participation.
6. Record actual Codex usage and preserve the genuine Codex session ID for the hackathon submission.

**Rollback:** Previous fully tested integrated submission at `93e68ecc8a62149e56ebea847d06e928cc91fd90`; Twitch-working baseline `main` remains untouched.
