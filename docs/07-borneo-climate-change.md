# Borneo — Climate Change Indicators

Copy-paste script to compare long-term temperature at any point or region in Borneo between two decades using ERA5-Land reanalysis.

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block (point or polygon), and click **Run**.

---

## What this measures

Climate change in Borneo manifests as shifting rainfall patterns, longer dry seasons, and rising temperatures — affecting peat fire risk and forest health. This script compares:

- **Mean monthly temperature (1991–2000)** vs **(2014–2023)** at your point or regional mean over a polygon
- **Temperature anomaly** in °C between the two periods

ERA5-Land is a **reanalysis** product (model + observations blended), not a ground weather station reading.

---

## Dataset

| Property | Value |
|----------|-------|
| Catalog ID | `ECMWF/ERA5_LAND/MONTHLY_AGGR` |
| Type | `ImageCollection` (monthly) |
| Band used | `temperature_2m` |
| Units | Kelvin (K) — script converts to °C |
| Update cadence | Monthly |
| Best for | Long-term climate averages and decadal comparison |

Catalog: [ECMWF/ERA5_LAND/MONTHLY_AGGR](https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_MONTHLY_AGGR)

---

## Geometry modes

- **Point mode:** set `GEOMETRY_MODE = 'point'`, edit `LNG`, `LAT`, and `BUFFER_KM`
- **Polygon mode:** set `GEOMETRY_MODE = 'polygon'`, paste coordinates into `POLYGON_COORDS` (closed ring: first point = last point)
- Temperature values use the point in point mode, or **regional mean** over the polygon in polygon mode

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
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = GEOMETRY_MODE === 'polygon'
  ? ee.Geometry.Polygon([POLYGON_COORDS])
  : point.buffer(BUFFER_KM * 1000);

var sampleGeom = GEOMETRY_MODE === 'polygon' ? aoi : point;
var sampleReducer = GEOMETRY_MODE === 'polygon'
  ? ee.Reducer.mean()
  : ee.Reducer.first();

var era5 = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR')
  .select('temperature_2m');

function meanTempC(start, end) {
  var meanK = era5
    .filterDate(start, end)
    .mean()
    .reduceRegion({
      reducer: sampleReducer,
      geometry: sampleGeom,
      scale: 10000,
      maxPixels: 1e9
    })
    .get('temperature_2m');
  return ee.Number(meanK).subtract(273.15);
}

var tempEarly = meanTempC('1991-01-01', '2000-12-31');
var tempRecent = meanTempC('2014-01-01', '2023-12-31');
var anomaly = tempRecent.subtract(tempEarly);

print('=== Climate change summary ===');
print('Geometry mode:', GEOMETRY_MODE);
print('Mean temp 1991-2000 (°C, point or regional mean):', tempEarly);
print('Mean temp 2014-2023 (°C, point or regional mean):', tempRecent);
print('Anomaly (recent - early, °C):', anomaly);

// Regional map: recent decade mean temperature
var recentMap = era5
  .filterDate('2014-01-01', '2023-12-31')
  .mean()
  .subtract(273.15);

Map.centerObject(aoi, GEOMETRY_MODE === 'polygon' ? 6 : 8);
Map.addLayer(aoi, {color: 'yellow'}, 'Analysis area');
Map.addLayer(point, {color: 'red'}, 'Point (point mode only)', GEOMETRY_MODE === 'point');

Map.addLayer(
  recentMap,
  {
    min: 20,
    max: 30,
    palette: ['#000004', '#410967', '#932567', '#f16e43', '#fcffa4']
  },
  'Mean temp 2014-2023 (°C)'
);
```

**Expected output (Console):**

```
Mean temp 1991-2000 (°C): ~25–27  (varies by elevation and location)
Mean temp 2014-2023 (°C): ~25.5–27.5
Anomaly (recent - early, °C): ~0.3–1.0  (positive = warming)
```

Lowland Kalimantan is typically warmer than highland Sabah. In polygon mode, values are averaged over the entire region.

---

## Limitations

- **Reanalysis ≠ measured weather** — good for trends, not for legal/met official records.
- **10 km effective scale** for extraction — fine for regional climate, coarse for microclimates.
- Compares **two fixed decades** — you can edit date ranges in `meanTempC()` calls for other periods.
- **Large polygons** may hit `maxPixels` limits — increase `scale` or simplify geometry if the script errors.
- Does not include rainfall; add `total_precipitation_sum` band from the same collection for precipitation trends.

---

## What's next

- [Weather](./09-borneo-weather.md) — short-term GFS forecast (days ahead)
- [Wildfire](./04-borneo-wildfire.md) — dry-season fire risk often rises with warming/drought
