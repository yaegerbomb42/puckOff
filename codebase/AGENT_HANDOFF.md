# puckOFF - Agent Orientation Guide

> **Project Status**: Active Development
> **Dev Server**: `npm start` → <http://localhost:3000>

---

## 1. Project Philosophy

**puckOFF** is a high-octane multiplayer physics arena game.

* **Aesthetic**: "Cyber-sport" / Tron-like. High contrast, neon, glassmorphism.
* **User Preferences**:
  * **Premium Quality**: No MVPs. Features must be polished and "wow" the user.
  * **Creative Engineering**: Don't just make a button; make it glow, hum, and react.
  * **Minimal Browser Usage**: Don't open tabs unless necessary.

---

## 2. Core Architecture

* **Frontend**: React + Three.js (`@react-three/fiber`) + Cannon.js (Physics).
* **Backend**: Node.js + Socket.IO (Real-time state).
* **Data**: Firebase (Auth + Firestore).
* **Economy**: "Zoins" (Integer-based currency).

### Key Files

* `src/components/BattleArena.jsx`: The main game loop and orchestrator.
* `src/components/Puck.jsx`: The player character. Contains complex material shaders and input handling.
* `src/utils/economy.js`: Constants for monetization and betting.
* `src/contexts/AuthContext.jsx`: Global state for User, Inventory, and Wagers.

---

## 3. Critical Context & "Gotchas"

* **API Keys**: Firebase Config is in `.env` (Source of Truth).
* **Audio**: Browser autoplay policies require a user gesture before `audio.init()` works.
* **Input**: `useGamepad.js` handles **both** Xbox/PS4 controllers and Keyboard inputs for the local player.
* **Shaders**: `Puck.jsx` uses custom shaders for high-tier icons (Legendary/Divine). Be careful editing materials.

---

## 5. Infrastructure & Nginx

* **Server IP**: `147.224.158.118` (Oracle Cloud)
* **SSH User**: `ubuntu`
* **SSH Key**: `ssh-key-2026-02-07private.key`
* **Nginx Proxy Manager (NPM)**:
  * **URL**: `http://147.224.158.118:81`
  * **Container**: `traffic-controller` (in `~/puckOff`)
  * **Restart Command**: `docker restart traffic-controller`
* **Static Sites (Landing Pages)**:
  * **Container**: `static-landings` (in `~/infra`)
  * **SwarmConnect**: Port `8081` (Internal/Host)
  * **Yaeger.info**: Port `8082` (Internal/Host)
  * **Raidball**: Port `8083` (Internal/Host)
  * **MyNow.online**: Port `8084` (Internal/Host)
  * **SwarmAgents.codes**: Port `8085` (Internal/Host)
  * **TurboToolbox.me**: Port `8086` (Internal/Host)

## 6. Deployment Workflow (How to Update Sites)

### Updating Landing Pages

1. **Edit Locally**: Modify files in `infra/landing-pages/` (e.g., `raidball/index.html`).
2. **Push to Server**: Run this command from your terminal:

    ```bash
    scp -o StrictHostKeyChecking=no -i ssh-key-2026-02-07private.key -r infra/landing-pages ubuntu@147.224.158.118:~/infra/
    ```

    *No restart required. Changes are live immediately.*

### Fetching Files FROM Server (Downloading)

If you made changes on the server and want to pull them down:

```bash
scp -o StrictHostKeyChecking=no -i ssh-key-2026-02-07private.key -r ubuntu@147.224.158.118:~/infra/landing-pages/* infra/landing-pages/
```

### Updating Nginx Configuration (Ports/Domains)

1. **Edit Locally**: Modify `infra/nginx.conf` or `docker-compose.yml`.
2. **Push Configs**:

    ```bash
    scp -o StrictHostKeyChecking=no -i ssh-key-2026-02-07private.key infra/nginx.conf infra/docker-compose.yml ubuntu@147.224.158.118:~/infra/
    ```

3. **Restart Container**:

    ```bash
    ssh -o StrictHostKeyChecking=no -i ssh-key-2026-02-07private.key ubuntu@147.224.158.118 "cd ~/infra && docker compose up -d --force-recreate"
    ```

## 7. Current Focus

We are currently polishing the "Golden Friction" economy and adding "Juice" (visual/audio feedback).
Refer to `core_todos.md` for the active task list.
