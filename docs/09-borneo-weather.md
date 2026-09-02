# Borneo — Weather Forecast

Copy-paste script for short-range weather forecast at any point or region in Borneo using NOAA GFS model output.

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block (point or polygon), and click **Run**.

---

## What this measures

Borneo has a tropical climate with wet and dry seasons. Monsoon shifts affect fire risk, flooding, and travel. This script reads the latest **GFS 24-hour forecast** for:

- **Temperature** at 2 m (°C)
- **Precipitation** (kg/m², equivalent to mm)
- **Wind speed** at 10 m (m/s, computed from U/V components)

GFS is a **forecast model**, not measured weather from ground stations. In polygon mode, values are **regional means** over your area.

---

## Dataset

| Property | Value |
|----------|-------|
| Catalog ID | `NOAA/GFS0P25` |
| Type | `ImageCollection` (forecast) |
| Bands used | `temperature_2m_above_ground`, `total_precipitation_surface`, `u_component_of_wind_10m_above_ground`, `v_component_of_wind_10m_above_ground` |
| Resolution | ~28 km |
| Update cadence | Every 6 hours (4 runs per day) |
| Best for | 1–5 day weather outlook |

Catalog: [NOAA/GFS0P25](https://developers.google.com/earth-engine/datasets/catalog/NOAA_GFS0P25)

---

## Geometry modes

- **Point mode:** set `GEOMETRY_MODE = 'point'`, edit `LNG`, `LAT`, and `BUFFER_KM`
- **Polygon mode:** set `GEOMETRY_MODE = 'polygon'`, paste coordinates into `POLYGON_COORDS` (closed ring: first point = last point)
- Forecast values use the point in point mode, or **regional mean** over the polygon in polygon mode

---

## Code Editor

```javascript
// ========== CUSTOMIZE (only edit this block) ==========
var GEOMETRY_MODE = 'point'; // 'point' | 'polygon'

// Point mode
var LNG = 113.9;
var LAT = -2.2;
var BUFFER_KM = 50;

// Polygon mode — closed ring, [longitude, latitude] pairs
var POLYGON_COORDS = [
  [108.8700352386492, -4.172197282145383],
  [118.4720860198992, -4.172197282145383],
  [118.4720860198992,  1.1414179180432524],
  [108.8700352386492,  1.1414179180432524],
  [108.8700352386492, -4.172197282145383]
];

var FORECAST_HOURS = 24;
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = GEOMETRY_MODE === 'polygon'
  ? ee.Geometry.Polygon([POLYGON_COORDS])
  : point.buffer(BUFFER_KM * 1000);

var sampleGeom = GEOMETRY_MODE === 'polygon' ? aoi : point;
var sampleReducer = GEOMETRY_MODE === 'polygon'
  ? ee.Reducer.mean()
  : ee.Reducer.first();

var now = ee.Date(Date.now());
var twoDaysAgo = now.advance(-2, 'day');

var gfs = ee.ImageCollection('NOAA/GFS0P25')
  .filterDate(twoDaysAgo, now)
  .filter(ee.Filter.eq('forecast_hours', FORECAST_HOURS))
  .sort('creation_time', false)
  .first();

var temp = gfs.select('temperature_2m_above_ground');
var precip = gfs.select('total_precipitation_surface');
var uWind = gfs.select('u_component_of_wind_10m_above_ground');
var vWind = gfs.select('v_component_of_wind_10m_above_ground');
var windSpeed = uWind.hypot(vWind);

var stats = gfs.select([
  'temperature_2m_above_ground',
  'total_precipitation_surface',
  'u_component_of_wind_10m_above_ground',
  'v_component_of_wind_10m_above_ground'
]).reduceRegion({
  reducer: sampleReducer,
  geometry: sampleGeom,
  scale: 28000,
  maxPixels: 1e9
});

var windStats = windSpeed.reduceRegion({
  reducer: sampleReducer,
  geometry: sampleGeom,
  scale: 28000,
  maxPixels: 1e9
});

print('=== Weather forecast (GFS ' + FORECAST_HOURS + 'h ahead) ===');
print('Geometry mode:', GEOMETRY_MODE);
print('Temperature (°C, point or regional mean):',
      stats.get('temperature_2m_above_ground'));
print('Precipitation (kg/m², point or regional mean):',
      stats.get('total_precipitation_surface'));
print('U wind (m/s):', stats.get('u_component_of_wind_10m_above_ground'));
print('V wind (m/s):', stats.get('v_component_of_wind_10m_above_ground'));
print('Wind speed (m/s, point or regional mean):',
      windStats.get('u_component_of_wind_10m_above_ground'));
print('GFS image metadata:', gfs);

// --- Map layers ---
Map.centerObject(aoi, GEOMETRY_MODE === 'polygon' ? 6 : 8);
Map.addLayer(aoi, {color: 'yellow'}, 'Analysis area');
Map.addLayer(point, {color: 'red'}, 'Point (point mode only)', GEOMETRY_MODE === 'point');

Map.addLayer(
  temp,
  {min: 20, max: 35, palette: ['blue', 'cyan', 'green', 'yellow', 'red']},
  'Temperature forecast (°C)'
);

Map.addLayer(
  precip,
  {min: 0, max: 50, palette: ['white', 'lightblue', 'blue', 'darkblue']},
  'Precipitation forecast (kg/m²)',
  false
);

Map.addLayer(
  windSpeed,
  {min: 0, max: 15, palette: ['white', 'yellow', 'orange', 'red']},
  'Wind speed (m/s)',
  false
);
```

**Expected output (Console):**

- Temperature: ~24–32 °C typical for lowland Borneo
- Precipitation: 0–50+ kg/m² depending on monsoon phase
- Wind speed: ~1–8 m/s typical; higher during storms
- GFS metadata showing `creation_time` and `forecast_hours`

> If no images match, widen the date filter or remove the `forecast_hours` filter temporarily to inspect available runs.

---

## Limitations

- **Forecast, not observation** — verify critical decisions with BMKG (Indonesia) or MetMalaysia (Malaysia) official forecasts.
- **~28 km resolution** — misses local convection and mountain effects (e.g. Mount Kinabalu).
- **Precipitation accumulation** depends on GFS `forecast_hours` window — see [catalog notes](https://developers.google.com/earth-engine/datasets/catalog/NOAA_GFS0P25) for accumulation rules.
- **Large polygons** may hit `maxPixels` limits — increase `scale` or simplify geometry if the script errors.
- Model runs every 6 hours; use latest `creation_time` for freshest forecast.

---

## What's next

- [Wildfire](./04-borneo-wildfire.md) — dry, windy forecasts increase fire spread risk
- [Climate change](./07-borneo-climate-change.md) — long-term temperature trends vs this short-term forecast
