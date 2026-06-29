# Golf Scorekeeper

## Overview
Mobile-responsive SPA for 6 players (3 teams of 2) to enter per-hole golf scores live during a round. Auto-saves on each tap. Live leaderboard. 1 round (18 holes, Copper Point).

## Stack
- **Frontend:** Vue 3 SPA (Vite build), served as static from Hono
- **Backend:** Hono (Node.js) — API server
- **Database:** SQLite via Drizzle ORM (better-sqlite3)
- **Container:** Single Docker container, volume for SQLite file
- **Deployment:** Komodo stack on homelab behind Cloudflare Zero Trust

## Roster (hardcoded seed)
| Team | Players |
|------|---------|
| Showie | Shawn + Joey |
| Dan | Brendan + Aidan |
| Smott | Scott + Matt |

## Data Model
- players: id | name | teamId
- teams: id | name
- scores: id | roundId | holeNumber (1-18) | playerId | strokes (unique: roundId + holeNumber + playerId)
- rounds: id | name | active boolean

## API Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/rounds | List rounds |
| POST | /api/rounds | Create round (auto-activates) |
| GET | /api/rounds/active | Get current active round |
| GET | /api/players | All players with team info |
| PUT | /api/scores | Upsert strokes for player/hole/round |
| GET | /api/leaderboard/:roundId | Team totals per hole + cumulative |

## Frontend Pages (Vue 3 SPA)
1. **Home** — Create or select a round
2. **Score Entry** — All 6 players grouped by team, +/- stroke entry, hole navigator, auto-save on tap, live team totals at bottom
3. **Leaderboard** — Team totals sorted, expandable per-hole, auto-refresh 10s

## UX Decisions
- No save button — reactive auto-save per stroke tap
- All 6 players visible at once, grouped by team
- Bottom dock: live team totals
- Bottom tab nav (mobile): Score | Leaderboard
- Light theme default

## Container & Deployment
- Dockerfile: multi-stage, node:20-alpine
- docker-compose.yml: single service, port 3000, volume at /data for SQLite
- No auth — Cloudflare Tunnel / Zero Trust upstream
