# CrowdQuest plan

## Architecture

- `packages/shared`: deterministic, dependency-free quest engine and chat parser. The Node server is authoritative.
- `apps/server`: Express API, Socket.IO state broadcasts, rate-limited command ingestion, optional Twitch OAuth/EventSub adapter.
- `apps/web`: Vite + React + Tailwind dashboard, transparent `/overlay`, and clearly labeled Demo Mode. Both screens consume the same Socket.IO state.

## Milestones

1. Establish workspace, game rules, parser, and mechanics tests.
2. Add authoritative server, real-time transport, and simulated input route.
3. Build dashboard and OBS overlay around live state.
4. Add credential-gated Twitch OAuth/EventSub with reconnection behavior and documentation.
5. Install, type-check, test, and production-build the project.

## First playable quest: The Ember Gate

The party chooses either the risky Sunken Bridge or slower Moonlit Pass. During the encounter, `attack` lowers threat, `shield` protects party health, and `heal` spends supplies to restore health. Path choice changes threat and supply stakes; the resolved action total produces victory or defeat. One vote/action per player per phase makes cooperation visible rather than a raw poll.
