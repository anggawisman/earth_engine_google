# Earth Engine Learning Guide

Beginner-friendly documentation for working with [Google Earth Engine](https://earthengine.google.com/) — from your first script to integrating data into a local Node.js web app.

This repo is a learning reference for GeoSafe geospatial evidence workflows. It is not a production application.

## Prerequisites Checklist

Before running the Node.js examples, confirm you have:

- [ ] A **Google Cloud project** with Earth Engine API enabled
- [ ] **Earth Engine access** registered for that project ([get started](https://earthengine.google.com/))
- [ ] A **service account** with Earth Engine permissions
- [ ] The service account **JSON key file** downloaded (never commit this file)
- [ ] **Node.js 18+** and npm installed locally
- [ ] The `@google/earthengine` package installed in your project (`npm install @google/earthengine`)

### Environment Variables

Create a `.env` file in your project root (see `.env.example` pattern in the integration guide):

```bash
GEE_CLOUD_PROJECT=your-gcp-project-id
GEE_SERVICE_ACCOUNT_KEY_PATH=./credentials/service-account-key.json
```

## Documentation Index

| Doc | What you'll learn |
|-----|-------------------|
| [01 — How Earth Engine Works](./01-how-earth-engine-works.md) | Mental model, core objects (`Image`, `ImageCollection`, `Geometry`), client vs server |
| [02 — Climate, Weather & Geophysical Scripts](./02-scripts-climate-weather-geophysical.md) | Copy-paste scripts for ERA5 climate, GFS weather, NASADEM elevation, WorldCover land cover |
| [03 — Node.js Web App Integration](./03-nodejs-webapp-integration.md) | Server architecture, API patterns, map tiles, security |
| [ADR-001 — Node.js Auth Strategy](./decisions/ADR-001-earth-engine-nodejs-auth.md) | Why service-account auth lives on the server |

## Borneo Monitoring (Code Editor)

Copy-paste scripts for Borneo — change only the **CUSTOMIZE** block in each guide (**point + buffer** or **polygon coordinates** via `GEOMETRY_MODE`). Recommended order for immediate hazards first, then longer trends:

| Doc | Topic |
|-----|-------|
| [09 — Weather](./09-borneo-weather.md) | GFS forecast: temperature, precipitation, wind |
| [04 — Wildfire](./04-borneo-wildfire.md) | FIRMS + VIIRS active fire detections |
| [05 — Deforestation](./05-borneo-deforestation.md) | Hansen forest loss + GLAD alerts |
| [06 — Tectonic & Volcanic](./06-borneo-tectonic-volcanic.md) | USGS earthquakes + thermal hotspots |
| [07 — Climate Change](./07-borneo-climate-change.md) | ERA5-Land decadal temperature comparison |
| [08 — CO2 & Carbon](./08-borneo-co2.md) | MODIS GPP + CAMS CO proxy (not direct CO2 ppm) |

## Example Scripts

Runnable Node.js snippets live in [`docs/examples/`](./examples/):

| File | Description |
|------|-------------|
| [`auth-init.js`](./examples/auth-init.js) | Reusable auth + `ee.initialize` wrapper |
| [`climate-era5.js`](./examples/climate-era5.js) | Monthly temperature at a point |
| [`weather-gfs.js`](./examples/weather-gfs.js) | Forecast precipitation map tiles |
| [`geophysical-nasadem.js`](./examples/geophysical-nasadem.js) | Elevation and land cover at a point |

Run an example (from repo root, after installing dependencies):

```bash
npm install @google/earthengine
export GEE_CLOUD_PROJECT=your-project-id
export GEE_SERVICE_ACCOUNT_KEY_PATH=./credentials/service-account-key.json
node docs/examples/climate-era5.js
```

## Recommended Learning Path

1. **Code Editor first** — Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the Code Editor blocks from doc 02, and click Run. This is the fastest way to see results on a map.
2. **Understand the model** — Read doc 01 so you know why code looks "backwards" (building a graph, not running loops).
3. **Run Node.js scripts** — Use the examples in `docs/examples/` with your service account.
4. **Plan your web app** — Read doc 03 for how to expose the same data through a local API.

## Official Resources

- [Earth Engine platform overview](https://earthengine.google.com/)
- [Data catalog](https://developers.google.com/earth-engine/datasets/) — browse climate, weather, geophysical datasets
- [NPM installation & authentication](https://developers.google.com/earth-engine/guides/npm_install)
- [JavaScript Code Editor quickstart](https://developers.google.com/earth-engine/guides/quickstart_javascript)
- [Client vs server computation](https://developers.google.com/earth-engine/guides/client_server)
