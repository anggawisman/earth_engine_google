# Climate, Weather & Geophysical Scripts

Hands-on examples for three Earth Engine data categories. Each section includes:

1. **Dataset overview** — what it is and when to use it
2. **Code Editor script** — paste and run at [code.earthengine.google.com](https://code.earthengine.google.com)
3. **Node.js script** — same logic with service account auth
4. **Expected output** — what you should see

Shared Node.js setup is documented once at the bottom. Example files live in [`docs/examples/`](./examples/).

---

## 1. Climate — ERA5 Land Monthly Temperature

### Dataset

| Property | Value |
|----------|-------|
| Catalog ID | `ECMWF/ERA5_LAND/MONTHLY_AGGR` |
| Type | `ImageCollection` (monthly aggregates) |
| Band used | `temperature_2m` |
| Units | Kelvin (K) — subtract 273.15 for °C |
| Update cadence | Monthly |
| Best for | Long-term climate averages, seasonal trends, historical comparison |

ERA5-Land is a **reanalysis** product: a consistent model blend of observations and simulations. It is not real-time weather.

Catalog: [ECMWF/ERA5_LAND/MONTHLY_AGGR](https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_MONTHLY_AGGR)

### Code Editor

Paste into the Code Editor and click **Run**:

```javascript
// Area of interest: Jakarta
var point = ee.Geometry.Point([106.8, -6.2]);

// Load January 2023 monthly climate data
var jan2023 = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR')
  .filterDate('2023-01-01', '2023-02-01')
  .first()
  .select('temperature_2m');

// Extract temperature at the point
var tempKelvin = jan2023.reduceRegion({
  reducer: ee.Reducer.first(),
  geometry: point,
  scale: 10000
});

print('Temperature (K):', tempKelvin);
print('Temperature (°C):', ee.Number(tempKelvin.get('temperature_2m')).subtract(273.15));

// Visualize on map
var visParams = {
  bands: ['temperature_2m'],
  min: 229,
  max: 304,
  palette: ['#000004', '#410967', '#932567', '#f16e43', '#fcffa4']
};

Map.addLayer(jan2023, visParams, 'Jan 2023 Temperature');
Map.setCenter(106.8, -6.2, 5);
Map.addLayer(point, {color: 'red'}, 'Jakarta');
```

**Expected output (Console):** something like `{temperature_2m: 298.4}` (Kelvin). The map shows a temperature raster with a red dot on Jakarta.

### Node.js

See [`docs/examples/climate-era5.js`](./examples/climate-era5.js):

```bash
node docs/examples/climate-era5.js
```

**Expected output (terminal):**

```json
{
  "location": "Jakarta",
  "date": "2023-01",
  "temperature_k": 298.4,
  "temperature_c": 25.25
}
```

---

## 2. Weather — GFS Forecast Precipitation

### Dataset

| Property | Value |
|----------|-------|
| Catalog ID | `NOAA/GFS0P25` |
| Type | `ImageCollection` (forecast model output) |
| Band used | `total_precipitation_surface` |
| Units | kg/m² (equivalent to mm of water) |
| Update cadence | Every 6 hours |
| Best for | Short-range precipitation forecasts (up to 384 hours ahead) |

GFS is a **forecast** model, not measured rainfall. Each image has `creation_time` (when the model ran) and `forecast_hours` (how far ahead it predicts).

Catalog: [NOAA/GFS0P25](https://developers.google.com/earth-engine/datasets/catalog/NOAA_GFS0P25)

### Code Editor

```javascript
// Southeast Asia bounding box [west, south, east, north]
var region = ee.Geometry.Rectangle([95, -11, 141, 6]);

// Get the most recent GFS run, 24-hour forecast precipitation
var gfs = ee.ImageCollection('NOAA/GFS0P25')
  .filterDate(ee.Date(Date.now()).advance(-2, 'day'), ee.Date(Date.now()))
  .filter(ee.Filter.eq('forecast_hours', 24))
  .sort('creation_time', false)
  .first()
  .select('total_precipitation_surface');

print('GFS image metadata:', gfs);

// Mean precipitation over the region
var regionalPrecip = gfs.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: region,
  scale: 25000,
  maxPixels: 1e9
});

print('Mean precipitation (kg/m²):', regionalPrecip);

// Visualize
var visParams = {
  bands: ['total_precipitation_surface'],
  min: 0,
  max: 50,
  palette: ['white', 'lightblue', 'blue', 'darkblue', 'purple']
};

Map.addLayer(gfs, visParams, 'GFS 24h Precipitation');
Map.centerObject(region, 4);
```

**Expected output:** Console shows metadata and a mean precipitation value. Map shows a precipitation layer over Southeast Asia.

> **Note:** If no images match the date filter, widen the date range or remove the `forecast_hours` filter temporarily to see what is available.

### Node.js

See [`docs/examples/weather-gfs.js`](./examples/weather-gfs.js):

```bash
node docs/examples/weather-gfs.js
```

**Expected output:** JSON with regional mean precipitation and a `mapTile` object (`mapid`, `token`, `urlFormat`) you can use in a web map.

---

## 3. Geophysical — Elevation & Land Cover

Geophysical data in the catalog includes terrain, land cover, hydrology, and more. Here are two common starting points.

### 3a. Elevation — NASADEM

| Property | Value |
|----------|-------|
| Catalog ID | `NASA/NASADEM_HGT/001` |
| Type | `ee.Image` (static — no date filter) |
| Band used | `elevation` |
| Units | meters above sea level |
| Resolution | ~30 m |

Catalog: [NASA/NASADEM_HGT/001](https://developers.google.com/earth-engine/datasets/catalog/NASA_NASADEM_HGT_001)

### 3b. Land Cover — ESA WorldCover

| Property | Value |
|----------|-------|
| Catalog ID | `ESA/WorldCover/v200` |
| Type | `ImageCollection` (2021 mosaic) |
| Band used | `Map` |
| Values | Class IDs 10–100 (tree cover, cropland, water, etc.) |
| Resolution | 10 m |

Catalog: [ESA/WorldCover/v200](https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200)

#### WorldCover class reference

| ID | Class |
|----|-------|
| 10 | Tree cover |
| 20 | Shrubland |
| 30 | Grassland |
| 40 | Cropland |
| 50 | Built-up |
| 60 | Bare / sparse vegetation |
| 70 | Snow and ice |
| 80 | Permanent water bodies |
| 90 | Herbaceous wetland |
| 95 | Mangroves |
| 100 | Moss and lichen |

### Code Editor

```javascript
var point = ee.Geometry.Point([106.8, -6.2]);

// --- Elevation ---
var elevation = ee.Image('NASA/NASADEM_HGT/001').select('elevation');

var elevStats = elevation.reduceRegion({
  reducer: ee.Reducer.first(),
  geometry: point,
  scale: 30
});

print('Elevation (m):', elevStats);

Map.addLayer(elevation, {min: 0, max: 1000, palette: ['green', 'yellow', 'brown']}, 'Elevation');
Map.setCenter(106.8, -6.2, 10);

// --- Land cover ---
var landCover = ee.ImageCollection('ESA/WorldCover/v200').first().select('Map');

var lcStats = landCover.reduceRegion({
  reducer: ee.Reducer.first(),
  geometry: point,
  scale: 10
});

print('Land cover class ID:', lcStats);

Map.addLayer(landCover, {min: 10, max: 100}, 'Land Cover');
Map.addLayer(point, {color: 'red'}, 'Sample point');
```

**Expected output:** Elevation around 8–15 m for coastal Jakarta; land cover class `50` (built-up) in the city center.

### Node.js

See [`docs/examples/geophysical-nasadem.js`](./examples/geophysical-nasadem.js):

```bash
node docs/examples/geophysical-nasadem.js
```

**Expected output:**

```json
{
  "location": "Jakarta",
  "elevation_m": 12,
  "land_cover_class_id": 50,
  "land_cover_label": "Built-up"
}
```

---

## Shared Node.js Setup

All Node.js examples depend on the same auth helper.

### 1. Install the client library

```bash
npm install @google/earthengine
```

### 2. Set environment variables

```bash
export GEE_CLOUD_PROJECT=your-gcp-project-id
export GEE_SERVICE_ACCOUNT_KEY_PATH=./credentials/service-account-key.json
```

### 3. Auth helper

[`docs/examples/auth-init.js`](./examples/auth-init.js):

```javascript
const ee = require('@google/earthengine');
const path = require('path');

function loadPrivateKey() {
  const keyPath = process.env.GEE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) {
    throw new Error('GEE_SERVICE_ACCOUNT_KEY_PATH is not set');
  }
  return require(path.resolve(keyPath));
}

function initEarthEngine(projectId) {
  const project = projectId || process.env.GEE_CLOUD_PROJECT;
  if (!project) {
    throw new Error('GEE_CLOUD_PROJECT is not set');
  }

  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      loadPrivateKey(),
      () => {
        ee.initialize(null, null, resolve, reject, null, project);
      },
      reject
    );
  });
}

function getInfo(eeObject) {
  return new Promise((resolve, reject) => {
    eeObject.getInfo((result, error) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

function getMapId(image, visParams) {
  return new Promise((resolve, reject) => {
    image.getMapId(visParams, (map, error) => {
      if (error) reject(error);
      else resolve(map);
    });
  });
}

module.exports = { ee, initEarthEngine, getInfo, getMapId };
```

### Getting results: `getInfo` vs `getMapId`

| Goal | Method | Returns |
|------|--------|---------|
| Number at a point | `image.reduceRegion(...)` → `getInfo()` | `{band_name: value}` |
| Display on a web map | `image.getMapId(visParams)` | `{mapid, token, urlFormat}` |

For map tiles, substitute `{x}`, `{y}`, `{z}` in `urlFormat` and append `&token=...` when requesting tiles from your frontend.

---

## What's Next

- **[Node.js web app integration](./03-nodejs-webapp-integration.md)** — turn these scripts into API endpoints for a local web app
- **[Data catalog](https://developers.google.com/earth-engine/datasets/)** — explore more climate, weather, and geophysical datasets
