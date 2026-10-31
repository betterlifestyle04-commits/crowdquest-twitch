# Live Stream Operations — CrowdQuest

This guide covers the **draft branch** `chatgpt/cinematic-visuals`, not the untouched Twitch-working baseline.

## New host tools

### Community readiness
A phase-aware readiness meter shows how many eligible players have selected their role, voted, or queued their ability. It also explains what chat should do next. It is informational: you still control when to advance, and the game remains server-authoritative.

### Recent game commands
The dashboard displays up to 12 recent CrowdQuest commands from a server-side rolling history of at most 24 events. Twitch commands are labeled **TWITCH**; simulator commands are labeled **SIMULATED**. The feed shows accepted/rejected outcomes and a brief explanation.

Only the four CrowdQuest command verbs (`!join`, `!role`, `!path`, `!act`) are considered for the feed; ordinary Twitch chat and unrelated bot commands are ignored. The monitor contains a truncated public display name and command, not OAuth tokens or numeric user IDs. It is read-only and does not send messages to Twitch.

Commands are rate-limited; excessively frequent attempts are rejected without broadcasting new dashboard events. Rehearsal still blocks real Twitch input until Reset.

### Safer host controls
Host actions now show the server's success/error response in the dashboard. Repeated Pause or invalid Start/Advance requests return an explicit error instead of silently appearing successful. Reset during an active quest asks for confirmation.

## Windows update procedure

1. Stop the running game with `Ctrl+C`.
2. In `C:\Users\anisk\crowdquest-twitch`, run `git status --short`. Preserve any uncommitted work.
3. Run `git fetch origin`.
4. If the cinematic branch is already installed: `git switch chatgpt/cinematic-visuals` then `git pull --ff-only origin chatgpt/cinematic-visuals`.
5. Otherwise: `git switch --track origin/chatgpt/cinematic-visuals`.
6. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `npm run dev`.
7. Open `http://localhost:5173`. Open the spectator `http://localhost:5173/spectator` in another tab and the OBS overlay `http://localhost:5173/overlay`.

Your private root `.env` should be preserved across branch changes; do not publish it. An OAuth reconnect may be required after server restart.

## Real Twitch acceptance test

1. Confirm the dashboard says **Live as [Twitch channel]** and does **not** say **SIMULATED REHEARSAL**. If a rehearsal is active, Reset to live lobby.
2. In your real channel chat, type `!join`. Confirm the adventurer count grows and the command monitor shows a `TWITCH`-labeled **accepted** entry.
3. Click Start Quest. During Muster, type `!role warrior`; confirm readiness increases. Try a wrong-phase action and verify it is rejected.
4. During route selection, send `!path B`; confirm a vote appears, the readiness bar changes, and the route transitions when advanced.
5. In the encounter, type `!act attack`. Check the queued action effect and then advance the phase; verify the *resolved* result shows the actual server-calculated damage.
6. Reach the Ember Lord, act, resolve, and inspect the final quest recap.
7. Confirm OBS and Spectator show synchronized gameplay. Use an OBS Browser Source at 1920×1080.
8. Test Pausing and Resuming. Try pressing Reset mid-quest and cancel the confirmation: the game must continue.
9. Capture real Twitch chat and the matching scene on video for the required hackathon demo. Do **not** present Showcase Studio's simulated participants as real viewers.

## Boundaries

The command monitor is a prototype read-only dashboard stream, not permanent audit storage; data resets when the backend restarts. The live game world also currently lives in memory and resets on server restart. Host diagnostic events are transported with the existing game state for local use, so do not expose this development server on the public Internet without a production security review.

Keep the previously rotated Twitch Client Secret private and out of GitHub, terminal screenshots and demo footage.
