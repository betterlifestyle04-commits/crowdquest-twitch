# CrowdQuest — Under-3-Minute Video Plan

**Target duration: ~2:40**. Record *genuine* gameplay through Twitch, plus a real Codex thread. The dedicated **http://localhost:5173/record** view shows the game beside server-confirmed Twitch commands; use it as the main recording source, supplemented by a short shot of the actual Twitch chat window. Do not use Showcase Studio footage to imply real viewers are present.

| Time | Footage | Voice-over / caption |
|---|---|---|
| 0:00–0:12 | Open with the Ember Lord in the dedicated `/record` view, with genuine Twitch chat commands visible alongside the game | “What if every Twitch viewer could become part of the same adventure?” |
| 0:12–0:28 | Real Twitch channel: viewer types `!join`; `/record` displays the accepted Twitch command and the new adventurer | “CrowdQuest turns live chat into a cooperative party.” |
| 0:28–0:45 | Chat chooses Warrior, Guardian, Healer and Scout roles; formation visuals animate | “Each player has a role, and coordinated teams unlock meaningful combinations.” |
| 0:45–1:03 | Chat votes `!path A` / `!path B`; route bars and environment change | “The community chooses the road and faces different threats.” |
| 1:03–1:28 | Real role actions, shared supplies, enemy, visible attack/shield/heal/scout effects and resolved combat numbers | “Commands aren't cosmetic. The server calculates combat, damage, resources and the consequences.” |
| 1:28–1:47 | Streamer triggers Rally or Emberstorm, optionally enables Smart Host | “The streamer can raise the stakes while keeping the audience in control.” |
| 1:47–2:08 | Final boss, actual outcome, victory/defeat, leaderboard and copied quest recap | “Every quest becomes a story the chat built together.” |
| 2:08–2:28 | Actual Codex session: show commands/prompts, code changes, tests or commit history | “OpenAI Codex helped build the Twitch integration, game engine, visuals, tests and improvements.” |
| 2:28–2:40 | Show the transparent OBS overlay beside the streamer dashboard; finish on logo/title | “CrowdQuest. Your chat. Your quest.” |

## Recording requirements

- Capture **real Twitch functionality** and **real Codex use**. Check that the recording view explicitly says **REAL TWITCH COMMANDS RECEIVED**, not **TWITCH NOT CONNECTED** or **SIMULATED**.
- The video must be **strictly under 3:00** (aim for 2:40).
- Upload to **YouTube** as Public or Unlisted, not Private. Verify the link from an incognito browser.
- Avoid copyrighted music or third-party game footage. Use original audio or voice only.
- Don't show Twitch Client Secret, control token, other private credentials, or personal data.
- Keep game commands readable at normal YouTube playback resolution.

Suggested YouTube title: **CrowdQuest — Twitch Chat Becomes a Cooperative Fantasy Adventure | Codex x TwitchCon Hackathon**

## Codex session proof

In the Codex thread where most development happened, enter `/status`. The resulting session ID must be copied separately into the Devpost form. Showing the actual Codex editing and testing workflow in the video satisfies the visual proof requirement better than only displaying commit hashes.

## After filming

Test YouTube URL from a logged-out browser. Copy the link into Devpost. Verify the submission page shows **Submitted**, not **Draft**, before the Nov 2, 2026 14:00 PST deadline (23:00 Oslo).
