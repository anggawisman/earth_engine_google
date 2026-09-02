# Borneo — Climate Change Indicators

Copy-paste script to compare long-term temperature at any point in Borneo between two decades using ERA5-Land reanalysis.

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block, and click **Run**.

---

## What this measures

Climate change in Borneo manifests as shifting rainfall patterns, longer dry seasons, and rising temperatures — affecting peat fire risk and forest health. This script compares:

- **Mean monthly temperature (1991–2000)** vs **(2014–2023)** at your point
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

## Code Editor

```javascript
// ========== CUSTOMIZE (only edit this block) ==========
var LNG = 113.9;      // longitude — Earth Engine uses [lng, lat]
var LAT = -2.2;       // latitude
var BUFFER_KM = 50;   // used for regional map layer only
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = point.buffer(BUFFER_KM * 1000);

var era5 = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR')
  .select('temperature_2m');

function meanTempC(start, end) {
  var meanK = era5
    .filterDate(start, end)
    .mean()
    .reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: point,
      scale: 10000
    })
    .get('temperature_2m');
  return ee.Number(meanK).subtract(273.15);
}

var tempEarly = meanTempC('1991-01-01', '2000-12-31');
var tempRecent = meanTempC('2014-01-01', '2023-12-31');
var anomaly = tempRecent.subtract(tempEarly);

print('=== Climate change summary ===');
print('Mean temp 1991-2000 (°C):', tempEarly);
print('Mean temp 2014-2023 (°C):', tempRecent);
print('Anomaly (recent - early, °C):', anomaly);

// Regional map: recent decade mean temperature
var recentMap = era5
  .filterDate('2014-01-01', '2023-12-31')
  .mean()
  .subtract(273.15);

Map.centerObject(point, 8);
Map.addLayer(point, {color: 'red'}, 'Your point');

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

Lowland Kalimantan is typically warmer than highland Sabah.

---

## Limitations

- **Reanalysis ≠ measured weather** — good for trends, not for legal/met official records.
- **10 km effective scale** for point extraction — fine for regional climate, coarse for microclimates.
- Compares **two fixed decades** — you can edit date ranges in `meanTempC()` calls for other periods.
- Does not include rainfall; add `total_precipitation_sum` band from the same collection for precipitation trends.

---

## What's next

- [Weather](./09-borneo-weather.md) — short-term GFS forecast (days ahead)
- [Wildfire](./04-borneo-wildfire.md) — dry-season fire risk often rises with warming/drought
