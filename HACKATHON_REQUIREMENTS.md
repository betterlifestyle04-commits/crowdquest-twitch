# Codex x TwitchCon 2026 — Compliance Review

**Reviewed October 30, 2026 against the official Devpost rules and resources.**

- Rules: https://twitchcon-codex.devpost.com/rules
- Resources/FAQ: https://twitchcon-codex.devpost.com/resources
- Deadline: **November 2, 2026, 2:00 PM Pacific Standard Time = 23:00 Oslo time**.
- Code release candidate: https://github.com/betterlifestyle04-commits/crowdquest-twitch

| Requirement | Evidence / status | Final human action |
| --- | --- | --- |
| New project built during submission period (Oct 23–Nov 2) | Repository initially committed Oct 28; later Codex commits Oct 29. **Supported by Git timestamps.** | Confirm project wasn't derived from earlier prohibited work |
| Interactive project for Twitch streamers and viewers | Twitch chat commands, Twitch OAuth/EventSub, streamer dashboard, spectator and OBS overlay. **Implemented** | Verify complete live Twitch quest using integrated branch |
| Built with OpenAI Codex | Many Codex-generated commits and user's development sessions. **Claimed and reflected in Git history** | Provide actual Codex session ID; show Codex use in demo |
| Installs and runs reliably | Node 22/npm 10 instructions; GitHub Actions installation, 34 tests, TypeScript/build, and HTTP smoke test pass. **Automated checks passed** | Confirm Windows/OBS live display and reconnect |
| Repository source, assets and setup instructions | Public GitHub branch includes all source assets, README, .env.example and JUDGE_SETUP. **Present** | Link the public main branch in Devpost; manually validate genuine Twitch + OBS before claiming it |
| English project description | SUBMISSION.md. **Prepared** | Copy into Devpost and tailor personal Codex account details |
| Codex session ID | **Missing from this repository** | Run `/status` inside the Codex thread where most code was developed; paste ID in Devpost |
| Demo video under 3 minutes | VIDEO_STORYBOARD.md prepared. **No video yet** | Record actual Twitch gameplay and actual Codex development; edit to ~2:40 |
| YouTube upload publicly visible | **Not yet provided** | Upload as Public or Unlisted (not Private); insert actual URL into Devpost |
| Video demonstrates functioning on Twitch | **Earlier Twitch baseline tested; integrated live session unverified** | Capture genuine Twitch chat messages and corresponding game responses |
| All materials original/authorized | Original SVG/CSS and synthetic sounds, standard permitted libraries; Twitch OAuth/EventSub via official APIs. **Apparent fit** | Check final video for unauthorized copyrighted music, third-party images and trademarks |
| Project available free for judges | Public repository, local instructions, simulated testing without credentials. **Present** | Ensure access/any necessary configuration remains available throughout judging |
| Eligible entrant | Individuals 18+; organizations excluded. **Not verifiable from code** | Register/submit as eligible individual, not as a company |
| Submit during period | **Not submitted by this repository work** | On Devpost, complete required form and click Submit; verify status Submitted rather than Draft |

## Four equally weighted judging criteria

1. **Innovation / idea:** CrowdQuest goes beyond a one-shot poll: synchronized multi-phase cooperative adventure, resource management, different roles, group formation synergy, streamer-triggered world events. Position this as a cooperative narrative rather than claiming it is the first Twitch chat game.
2. **Potential impact:** Makes Twitch viewers active participants and gives streamers a repeatable social segment. Show this with real chat and one compelling group decision in the video.
3. **Technological implementation:** Node/Express, React/Socket.IO, Twitch OAuth/EventSub, server-authoritative deterministic engine, tests, live diagnostics, and actual Codex-based iteration. Include the real Codex session and independent test evidence.
4. **Design:** Original animated world, distinct encounter art, spectator/OBS views, clear commands, sound opt-in and reduced-motion support. Must be visually verified on the user's real Windows/OBS setup; CI cannot assess presentation quality.

## Final recommendation

**Code-level candidate: GO to manual acceptance testing. Devpost submission as fully verified Twitch experience: NOT YET.**

Do not imply a synthetic Showcase Studio session is genuine Twitch participation. A correct, complete three-minute video with real Twitch commands and Codex footage is more valuable than adding more untested features immediately before submitting.

Before submitting, preserve a stable commit SHA for the video demonstration and ensure the Devpost repository points to that same branch/commit. Do not change the submitted version after the deadline without permission.

This review evaluates the GitHub sources and official rule text. It does not confirm Devpost account membership, recorded video, Codex session ID, eligibility, or the user's local OBS interface.
