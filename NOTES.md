# puckOFF - Agent Notes

## Key Gotchas

### Firebase Auth

- API key and config are in `.env` (gitignored)
- Production gets env vars from GitHub Actions secrets (see `deploy.yml`)
- If `auth/invalid-api-key` returns, check that all secrets exist in GitHub repo settings

### Standard Icons (Tier 0)

- **No image files exist** for standard colors — they reference `/images/pucks/standard_*.png` which don't exist
- All icon rendering must check `icon.tier === 0 && icon.color` and render a colored `<div>` instead of an `<img>`
- Fixed in: `IconChooser.jsx`, `Lobby.jsx`
- `PuckPreview.jsx` already handled this correctly (line 15: `hasTexture = icon?.tier !== 0`)

### Deployment

- Deploy pipeline: push to `main` → GitHub Actions → SSH to Oracle VPS → Docker build
- `.env` is generated on server from GitHub secrets (not committed)
- Docker build uses `--no-cache` to avoid stale builds
- Browser may cache old JS bundles; hard refresh (Ctrl+Shift+R) clears this

### Auth Wall

- `App.js` enforces login before game access
- Users can also choose "Play Offline"
- `BattleArena` receives `forceOffline` prop when in offline mode
- "Login to Save Progress" link appears inside BattleArena for offline users
