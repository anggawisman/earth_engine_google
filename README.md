# Earth Engine Google — Learning Repo

Learning documentation and example scripts for [Google Earth Engine](https://earthengine.google.com/), intended for GeoSafe geospatial evidence workflows.

## Quick Start

1. Read the [documentation index](docs/README.md)
2. Try scripts in the [Code Editor](https://code.earthengine.google.com) (no local setup needed)
3. Run Node.js examples with your service account:

```bash
npm install @google/earthengine
export GEE_CLOUD_PROJECT=your-project-id
export GEE_SERVICE_ACCOUNT_KEY_PATH=./credentials/service-account-key.json
node docs/examples/climate-era5.js
```

## Documentation

| Guide | Description |
|-------|-------------|
| [docs/README.md](docs/README.md) | Index and prerequisites |
| [01 — How Earth Engine Works](docs/01-how-earth-engine-works.md) | Mental model and core concepts |
| [02 — Climate, Weather & Geophysical Scripts](docs/02-scripts-climate-weather-geophysical.md) | Copy-paste scripts for ERA5, GFS, NASADEM, WorldCover |
| [03 — Node.js Web App Integration](docs/03-nodejs-webapp-integration.md) | Backend architecture and API patterns |

## Example Scripts

- [`docs/examples/climate-era5.js`](docs/examples/climate-era5.js) — monthly temperature at a point
- [`docs/examples/weather-gfs.js`](docs/examples/weather-gfs.js) — forecast precipitation map tiles
- [`docs/examples/geophysical-nasadem.js`](docs/examples/geophysical-nasadem.js) — elevation and land cover

## Official Resources

- [Earth Engine platform](https://earthengine.google.com/)
- [Data catalog](https://developers.google.com/earth-engine/datasets/)
- [NPM installation guide](https://developers.google.com/earth-engine/guides/npm_install)
