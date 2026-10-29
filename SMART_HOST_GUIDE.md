# Smart Host — opt-in community-driven phase progression

The **Smart Host** card is available only in the streamer dashboard (not the read-only OBS overlay). It reduces repetitive phase management in Twitch livestreams.

## How it works

- Default is **OFF**. The host enables it with the same streamer authorization used for other game controls.
- When **every eligible viewer** has responded during role selection, route voting, the encounter, or the boss fight, the server starts a **3.5-second grace period**. The dashboard displays the remaining seconds.
- The grace period gives participants time to switch votes or review what they submitted.
- When the grace period finishes, the server automatically advances the authoritative quest state. It broadcasts the result to the dashboard, spectator view, and OBS overlay.
- **Manual Advance and the usual phase timer remain active.** Normal phase timeout may advance first if fewer than 3.5 seconds remain.
- It does **not** auto-advance with zero eligible players, in the lobby, during noninteractive briefing/consequence, on the result screen, while paused, or during a Showcase Studio rehearsal.
- A late arrival during role selection prevents auto-advance until that player chooses a role. Joining during path and combat remains closed by normal rules.
- Disabling Smart Host or pausing resets any pending grace period. Resuming requires a fresh grace window.
- The streamer can turn it off at any time.

## How eligibility is counted

| Phase | Who counts as eligible | Required input |
|---|---|---|
| Role selection (Muster) | Every joined participant | Choose a role |
| Route vote | Every joined participant | One A/B vote per person |
| Encounter | Participants with an assigned role | One matching role action |
| Final boss | Participants with an assigned role | One matching role action |

Players who joined without a role are visible as unassigned in the streamer readiness card, but cannot block combat auto-advance. They *do* need to vote during the route phase.

## Windows play test

Stop the game with `Ctrl+C`, then, from `C:\Users\anisk\crowdquest-twitch`:

```powershell
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

If the branch does not yet exist on the PC, replace the `git switch` command with `git switch --track origin/chatgpt/cinematic-visuals`. Keep the root `.env` file private and unchanged.

1. Open `http://localhost:5173`, scroll to the **Smart Host** card, and enable it.
2. Join from your real Twitch chat using `!join` or via labeled Demo Mode.
3. Click **Start Quest**. Select a role during Muster and check that the 3.5-second countdown starts after everyone selects a role.
4. During voting, use `!path B`. If all eligible players vote, the route should resolve after the grace period.
5. During combat, use a matching role action and verify the next encounter transition occurs automatically.
6. Pause during a grace countdown; verify the auto-timer disappears and the quest does not progress. Resume; verify another full grace period is required.
7. Disable Smart Host and check that only manual Advance / normal phase timers progress the game.
8. Use Showcase Studio; Smart Host must not accelerate its simulated scene.
9. Complete one end-to-end real Twitch playthrough to verify the integration and OBS render before merging this draft PR.

## Security / limitations

The on/off endpoint is authenticated with `requireStreamer` and accepts only a boolean value. In local development, streamer controls may be open if the development token is not set. **Do not expose the dev server directly to the public internet.**

This is a convenience feature and does not ensure every participant has a good connection or actually watched the scene. Host monitoring remains recommended. A Twitch disconnect does not itself pause the active phase timer. The game state remains in memory and resets when the backend process restarts.
