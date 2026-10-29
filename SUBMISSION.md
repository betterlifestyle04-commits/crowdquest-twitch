# CrowdQuest — The Ember Gate
## Codex x TwitchCon Hackathon 2026

**Tagline:** Your chat becomes the party. Every decision changes the adventure.

**Source code:** https://github.com/betterlifestyle04-commits/crowdquest-twitch/tree/submission/integrated-crowdquest

**Demo video:** [Add public or unlisted YouTube link after uploading]

**Codex session ID:** [Get the ID from `/status` in the Codex thread where most of the game was built. This is required on Devpost.]

### Inspiration

Twitch chat is full of collective energy, but viewers are usually spectators or occasional voters. CrowdQuest turns the audience into a cooperative adventure party. Each viewer can become a Warrior, Guardian, Healer, or Scout. Instead of merely reacting to a stream, chat drives a shared fantasy world in real time.

### What it does

CrowdQuest is a browser-based, Twitch-interactive co-op fantasy game called **The Ember Gate**. Streamers run the game from a dashboard while viewers participate directly from Twitch chat. Their commands determine team composition, route choices, encounter tactics, shared resources, and the final boss outcome.

Viewers use `!join` to enter, `!role warrior` / `guardian` / `healer` / `scout` to choose a role, `!path A` or `!path B` to select a route, and role-appropriate `!act` commands to fight together. A server-authoritative TypeScript game engine resolves the results, while Socket.IO synchronizes the streamer dashboard, full-screen spectator view, and transparent OBS browser overlay.

The dangerous Sunken Bridge and safer Moonlit Pass lead to different encounters. Coordinating all four roles activates **Full Party Formation**, and Scout/Warrior synergy can improve a strike. The party shares health, healing supplies, and a rising gate threat. The streamer can trigger Rally or Emberstorm events to raise the stakes.

The game includes cinematic SVG scenes, distinct foes, battle-resolution visual effects, optional original synthesized audio, a solo Ember Spirit companion, an opt-in Smart Host for automatic phase progression, command diagnostics, session recap, and a clearly labeled simulated Showcase Studio for testing.

### How we built it with Codex

OpenAI Codex was used throughout development to build and iterate on the React/Vite user interface, TypeScript quest engine, Node/Express server, Twitch EventSub connection, OBS spectator experience, animations, automated tests, and documentation. Iterative Codex sessions also added live scene HUD elements, four-role formation mechanics, shared-resource visuals, streamer-event controls, responsive design, and accessibility improvements.

The workflow was iterative: use Codex to propose and implement features, inspect source changes, run automated checks, fix defects, and validate behavior with the streamer. Describe your own actual Codex process in the video and show the real Codex interface/session; do not portray this text as independent proof of Codex usage.

### Technologies

TypeScript; Node.js; Express; Socket.IO; React; Vite; CSS/SVG animations; Web Audio; Twitch OAuth; Twitch EventSub WebSockets; Vitest; GitHub Actions.

### Challenges

Building a real Twitch-connected game means handling Twitch authorization, EventSub reconnections, real-time state consistency, phase eligibility, duplicated chat commands, streamer authorization, and display latency. We separated Twitch chat delivery from a deterministic, server-authoritative quest engine and labeled simulated participants to avoid confusing rehearsal footage with genuine Twitch interaction.

### Accomplishments

- Real Twitch OAuth/EventSub integration implemented; an earlier baseline was manually verified with actual Twitch chat.
- Complete cooperative adventure engine with path choices, roles, team combinations, resource management, and a boss finale.
- Three synchronized browser experiences: dashboard, spectator, and OBS overlay.
- Automated checks for the shared engine, chat handling, security-sensitive controls, and a full simulated end-to-end HTTP quest.
- Zero npm dependency advisories reported by CI for the integrated lockfile.

**Verification note:** The final integrated branch has passed automated tests and build checks; its complete real-Twitch and OBS playthrough still requires the owner's final manual validation before claiming this integrated version was live-tested.

### What's next

More adventures, improved creator customization, stronger persistence and deployment, community statistics, new encounter variations, and additional cooperative mechanics.

### Installation and testing

See [JUDGE_SETUP.md](JUDGE_SETUP.md) for complete instructions. The demo can run locally without Twitch credentials, while **live** Twitch play requires the judge's or streamer's own Twitch developer application and OAuth authorization. No keys are committed.

### Original work and third-party assets

Original SVG illustrations, CSS effects, and synthesized audio effects are included. We do not ship commercial artwork or copyrighted background music. Twitch integration is implemented using Twitch's documented OAuth/EventSub APIs. The project was created during the October 23–November 2, 2026 submission period.

---

**Before copying into Devpost:** insert the actual YouTube URL and Codex session ID; ensure all functionality shown in the video has been tested on the integrated branch. Use your own actual development experience to refine the “How we built it with Codex” section.

Official requirements: https://twitchcon-codex.devpost.com/rules
