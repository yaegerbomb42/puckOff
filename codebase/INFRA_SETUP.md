# Infrastructure Handoff Guide

This folder contains the core infrastructure for the Yaeger Network (Nginx Proxy Manager, Static Landing Pages, Docker Configs).

## How to Start in a New Agent Instance

1. **Upload**: Upload `infra.zip` to the new agent's workspace.
2. **Unzip**:

    ```bash
    unzip infra.zip
    ```

3. **Start Services**:

    ```bash
    cd infra
    docker-compose up -d
    ```

## What's Included?

- **Nginx Proxy Manager**: Handles all domains (`yaeger.info`, `puckoff.tech`, etc.).
- **Landing Pages**: Low-code static sites for all domains.
- **SSL Certs**: Managed by NPM (data is in Docker volumes, not this zip).

**Note**: The actual game code (`puckOff`) is NOT in this zip. This is just the "Traffic Controller" and "Landing Page" layer.
