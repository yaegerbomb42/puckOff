# puckOFF - Development Notes

## Offline Mode Architecture

- `useMultiplayer.js` handles offline state with `isOffline` flag
- `enableOfflineMode()` fakes connection (`connected=true`) and sets `playerId='offline_p1'`
- Bot player: `{ id: 'offline_bot', name: 'BOT', color: '#ff006e', isBot: true }`
- `setReady()` transitions to `'playing'` and generates a random seed for map gen
- `requestRematch()` resets to lobby with fresh players for offline mode
- Powerup spawning guard: check `multiplayer.connected && !multiplayer.isOffline` to allow local spawns

## Bot AI (BattleArena.jsx)

- State machine: **chase** (dist > 8) → **orbit** (3-6 range) → **dash** (< 3, 2s cooldown)
- Runs at ~30fps via `setInterval(33ms)`
- Updates `playerPositions['offline_bot']` which feeds into Puck's `remotePosition`
- Bot puck is kinematic (mass=0), position-driven via `remotePosition` prop

## Key Gotchas

- `multiplayer.connected` is TRUE in offline mode (faked) — always check `isOffline` for offline-specific logic
- `player.position` on player objects is NOT the same as `playerPositions[id]` — positions from AI loop go into state, Puck reads from `remotePosition` prop
- Lobby needs `playerId` set to find the local player for ready/vote actions
- `selectMode` needs offline fallback since it uses socket.emit

## Zoin Coin Assets

- Located at `public/images/zoins/`
  - `zoin_base.png` — Gold/holographic base coin
  - `zoin_starter.png` — Teal/mint (Starter tier)
  - `zoin_pro.png` — Blue/violet (Pro tier)
  - `zoin_whale.png` — Gold/magenta (Whale/Legendary tier)

## Deployment (.env & Secrets)

- `.env` is **gitignored** — it never reaches the Oracle server via git pull
- `deploy.yml` generates `.env` on the server from **GitHub repo secrets** before `docker compose build`
- Both frontend (build args) and backend (env_file) read from this generated `.env`
- **If you add a new env var**, you MUST also:
  1. Add it as a GitHub secret in repo Settings → Secrets → Actions
  2. Add it to `deploy.yml` in BOTH the `env:` block AND `envs:` list
  3. Add an `echo` line to write it into `.env`
- The YAML linter warns "Context access might be invalid" for all secrets — this is a false positive
