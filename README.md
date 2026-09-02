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

### Borneo Monitoring (Code Editor)

Each guide supports **point + buffer** or **polygon coordinates** via `GEOMETRY_MODE`.

| Guide | Topic |
|-------|-------|
| [04 — Wildfire](docs/04-borneo-wildfire.md) | FIRMS + VIIRS fire detections |
| [05 — Deforestation](docs/05-borneo-deforestation.md) | Hansen loss + GLAD alerts |
| [06 — Tectonic & Volcanic](docs/06-borneo-tectonic-volcanic.md) | Earthquakes + thermal hotspots |
| [07 — Climate Change](docs/07-borneo-climate-change.md) | Decadal temperature comparison |
| [08 — CO2 & Carbon](docs/08-borneo-co2.md) | GPP + combustion proxy |
| [09 — Weather](docs/09-borneo-weather.md) | GFS forecast (point or regional mean) |

## Example Scripts

- [`docs/examples/climate-era5.js`](docs/examples/climate-era5.js) — monthly temperature at a point
- [`docs/examples/weather-gfs.js`](docs/examples/weather-gfs.js) — forecast precipitation map tiles
- [`docs/examples/geophysical-nasadem.js`](docs/examples/geophysical-nasadem.js) — elevation and land cover

## Official Resources

- [Earth Engine platform](https://earthengine.google.com/)
- [Data catalog](https://developers.google.com/earth-engine/datasets/)
- [NPM installation guide](https://developers.google.com/earth-engine/guides/npm_install)
