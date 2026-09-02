# ADR-001: Earth Engine Node.js Authentication Strategy

## Status

Accepted

## Date

2025-09-02

## Context

GeoSafe needs to integrate Google Earth Engine data (climate, weather, geophysical layers) into a local Node.js web application. Earth Engine supports two authentication methods in the JavaScript API:

1. **OAuth (client-side)** — users log in with their own Google account; each user must have Earth Engine access
2. **Service account (server-side)** — a private key JSON file authenticates the server; users of the app do not need EE accounts

The application will run a Node.js backend that serves geospatial data to a web frontend. Credentials must not be exposed to end users or the browser.

## Decision

Use **server-side service account authentication** (`ee.data.authenticateViaPrivateKey`) in Node.js, with Earth Engine initialized once at server startup.

The web frontend calls our backend API. The backend proxies all Earth Engine requests. Private keys are loaded from environment variables and never sent to the client.

## Alternatives Considered

### OAuth in the browser

- Pros: No private key on server; each user uses their own EE quota
- Cons: Every user must have Earth Engine access; poor fit for a consumer-facing GeoSafe app; OAuth popup UX friction
- Rejected: GeoSafe users should not need Google Cloud accounts

### Python `earthengine-api` client

- Pros: Mature Python ecosystem; widely used in research
- Cons: This learning repo and planned integration target Node.js; team preference for JavaScript stack
- Rejected for this project: Node.js chosen for web app consistency

### Client-side private key (anti-pattern)

- Pros: Simpler architecture (no backend)
- Cons: Earth Engine client library explicitly blocks this; exposes credentials in browser DevTools
- Rejected: Security violation

## Consequences

- A **backend proxy is required** for all Earth Engine operations in the web app
- Map tiles are served via `getMapId()` → tile URL returned to frontend (token included in URL, scoped to the map session)
- Service account JSON must be stored securely (`.env`, secret manager) and listed in `.gitignore`
- Server handles rate limiting and input validation before calling Earth Engine
- Aligns with GeoSafe pattern of server-held credentials for external data sources
- Future: if we need per-user EE asset access, consider a hybrid where OAuth is offered as an optional power-user feature — but default remains service account

## References

- [NPM Installation & Authentication](https://developers.google.com/earth-engine/guides/npm_install)
- [ee.data.authenticateViaPrivateKey API](https://developers.google.com/earth-engine/apidocs/ee-data-authenticateviaprivatekey)
- [docs/03-nodejs-webapp-integration.md](../03-nodejs-webapp-integration.md)
