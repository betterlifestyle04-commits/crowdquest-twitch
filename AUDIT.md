> **Historical note:** This audit describes the October 28 baseline. Its claims about unpatched Zod and pending lifecycle work are outdated for the October 30 submission build. See [SECURITY_AND_RELEASE.md](SECURITY_AND_RELEASE.md) and the integrated branch's GitHub Actions results: the lockfile now uses Zod 4.6.7 and Vitest 5.0.5 with zero npm-audit findings as of the verified CI run. This does not establish that all runtime risks are resolved.

# CrowdQuest 2.0 audit

Audited: 28 October 2026

## Architecture

The repository is a TypeScript npm workspace: a dependency-free shared quest engine, an Express/Socket.IO authoritative server, and a React/Vite/Tailwind dashboard plus transparent overlay. Demo and Twitch messages already converge at one server-side command handler, which is the right authority boundary.

## Fixed in the Stability & Security milestone

- Root `.env` loading is now resolved from the server source location, so `npm run dev`, `npm run start -w @crowdquest/server`, and production working directories load the same root file.
- Node 22+ is required explicitly; this provides the built-in WebSocket API used by the EventSub adapter.
- Streamer controls and Demo Mode are protected by `STREAMER_CONTROL_TOKEN` whenever it is configured, and always in production. The overlay remains read-only.
- The dashboard asks the streamer for that token at runtime and holds it only in memory; no token is built into the Vite bundle.
- CORS is restricted to the comma-separated `WEB_ORIGIN` allowlist rather than an implicit wildcard.
- OAuth/EventSub state already includes a CSRF state, expiry check, server-only token exchange, event subscription confirmation, revocation state, and notification tests.

## Remaining risks / next work

1. **EventSub lifecycle:** token refresh, keepalive deadlines, bounded reconnect retries, and event-message deduplication must be completed and tested before calling live integration reliable.
2. **Authentication:** production needs a strong `STREAMER_CONTROL_TOKEN`; full Twitch-identity-based streamer authorization is a subsequent enhancement.
3. **Game scope:** The current Ember Gate has one route and one encounter. Roles, seeded multi-stage branching, scaling, and results/leaderboard remain Milestone 2 work.
4. **Operational persistence:** State and OAuth session are memory-only; a process restart ends an active session. This is acceptable for local development but must be made explicit for deployment.
5. **E2E testing:** Unit and server integration tests exist; real Twitch events and browser/OBS behavior remain unverified without valid credentials and a configured Twitch app.

## Dependency audit

`npm audit --omit=dev --audit-level=high` was run on 28 October 2026. It reports one high-severity advisory in `zod` (GHSA-mrhx-c7xc-m3w5) with no upstream fix currently available. CrowdQuest accepts only bounded, small request bodies (`20kb`) and validates fixed-size strings/enums rather than unbounded collections, which limits the relevant exposure. Monitor the advisory and upgrade when a compatible fixed release is published.
