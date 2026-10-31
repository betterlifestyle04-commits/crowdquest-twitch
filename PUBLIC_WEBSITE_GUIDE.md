# CrowdQuest — Public website and live Twitch deployment

The website is a real production React/Node application, not a screenshot. The main URL serves a **simulated, interactive scene gallery**, while actual Twitch-controlled gameplay remains separate.

## Available routes after deployment

| Path | What it is | Access |
|---|---|---|
| `/` | Public game landing page and interactive chapter previews | Everyone; **simulated only** |
| `/showcase` | Same public gallery | Everyone; **simulated only** |
| `/dashboard` | Real streamer dashboard | Visible to everyone; changing game state requires a bearer token |
| `/spectator` | View real server state | Everyone |
| `/record` | Real Twitch-origin command receipts and recording view | Everyone |
| `/overlay` | Transparent live OBS overlay | Everyone |
| `/health` | Server health | Everyone |

These are not six separate websites: a single Node server serves the static React bundle, API and Socket.IO, with browser routing. The public gallery uses only the shared deterministic quest engine and never fakes a real Twitch connection.

## Render web-service deployment

- Repository: `https://github.com/betterlifestyle04-commits/crowdquest-twitch`
- Branch: `main`
- Runtime: Node.js 22+, npm 10+
- Build: `npm ci --include=dev && npm run build`
- Start: `npm run start -w @crowdquest/server`
- Port: set by Render automatically as `PORT`
- Region: Frankfurt
- Environment: `NODE_ENV=production`, `WEB_ORIGIN=https://<actual-service-host>.onrender.com`
- The frontend defaults to same-origin API and Socket.IO in its production bundle; do not point it to `http://localhost:3001` on the public website.

**Security:** The server will require `STREAMER_CONTROL_TOKEN` for all control/demo endpoints in production. When no secret is provided, all state-changing controls return **401**. This is intentional and protects the public site. To enable live hosted Twitch later, set a secure random streamer token and the real `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, and matching HTTPS `TWITCH_REDIRECT_URI` in Render's private environment settings; register exactly that URL in the Twitch developer console, then connect from the dashboard. Never publish these credentials or put them in GitHub.

You can also continue running real Twitch integration and recording locally without any hosted credentials. Twitch OAuth and EventSub are per server process; restarting the deployed service clears the current authorization and quest state. The free Render plan can sleep after inactivity, causing a slow first visit.

## What judges can actually verify online

- Original CrowdQuest product design and the high-fidelity chapter selector
- Six engine-generated, explicitly simulated scenes: camp, roles, vote, encounter, boss, conclusion
- Class-themed character art, spell preparations, HUD, quest lore, vote distribution, battle result and game outcomes
- Public source code and local instructions to verify real Twitch OAuth and EventSub

The hosted gallery is **not proof of real Twitch chat**, and it must not be described that way. A separate genuine OBS demonstration is needed for competition evidence.

## Release check

After successful deployment, verify with HTTP:
- `GET /` returns the HTML shell and linked hashed Vite assets
- `GET /showcase`, `/spectator`, `/record`, `/overlay` return 200
- `GET /health` returns `{"ok":true}`
- `GET /api/state` returns the current server state, with `controlsProtected:true`
- `POST /api/control/start` without a token returns **401**
- Browser navigation, chapter selection, CSS, WebSocket origin, and layout all function on the live URL

The CI workflow checks security advisories, tests, TypeScript, production build, local full-game HTTP and route smoke tests. An actual public-browser visual pass is still required to validate rendering, responsive layout and OBS framing.
