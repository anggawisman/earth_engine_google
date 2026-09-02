# Borneo — Wildfire Monitoring

Copy-paste script for active fire detections near any point in Borneo. Defaults to central Kalimantan (a common peat-fire zone).

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block, and click **Run**.

---

## What this measures

Borneo experiences seasonal wildfires, especially during dry periods in Kalimantan and Sumatra-adjacent areas. Peat fires can smolder for weeks and produce heavy smoke (haze). This script checks:

1. **MODIS FIRMS** — 1 km active fire detections (long archive, near real-time)
2. **VIIRS** — 375 m active fire detections (better for small fires, shorter archive)

---

## Datasets

### FIRMS (MODIS)

| Property | Value |
|----------|-------|
| Catalog ID | `FIRMS` |
| Type | `ImageCollection` |
| Bands used | `confidence`, `T21` |
| Resolution | ~1 km |
| Update cadence | Daily |
| Best for | Long-term fire monitoring, regional overview |

Catalog: [FIRMS](https://developers.google.com/earth-engine/datasets/catalog/FIRMS)

### VIIRS (Suomi NPP)

| Property | Value |
|----------|-------|
| Catalog ID | `NASA/LANCE/SNPP_VIIRS/C2` |
| Type | `ImageCollection` |
| Bands used | `confidence`, `Bright_ti4`, `frp` |
| Resolution | 375 m |
| Update cadence | Daily |
| Best for | Smaller fires, higher spatial detail |

Catalog: [NASA/LANCE/SNPP_VIIRS/C2](https://developers.google.com/earth-engine/datasets/catalog/NASA_LANCE_SNPP_VIIRS_C2)

---

## Code Editor

```javascript
// ========== CUSTOMIZE (only edit this block) ==========
var LNG = 113.9;      // longitude — Earth Engine uses [lng, lat]
var LAT = -2.2;       // latitude
var BUFFER_KM = 50;   // analysis radius around the point
var LOOKBACK_DAYS = 30;
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = point.buffer(BUFFER_KM * 1000);

var endDate = ee.Date(Date.now());
var startDate = endDate.advance(-LOOKBACK_DAYS, 'day');

// --- MODIS FIRMS (1 km) ---
var firms = ee.ImageCollection('FIRMS')
  .filterDate(startDate, endDate)
  .filterBounds(aoi)
  .select('confidence');

var firmsMax = firms.max();
var firmsMask = firmsMax.gt(0);

var firmsCount = firmsMask.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 1000,
  maxPixels: 1e9
});

// --- VIIRS (375 m) ---
var viirs = ee.ImageCollection('NASA/LANCE/SNPP_VIIRS/C2')
  .filterDate(startDate, endDate)
  .filterBounds(aoi)
  .select('confidence');

var viirsMax = viirs.max();
var viirsMask = viirsMax.gte(0);

var viirsCount = viirsMask.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 375,
  maxPixels: 1e9
});

print('=== Wildfire summary ===');
print('Lookback days:', LOOKBACK_DAYS);
print('Buffer radius (km):', BUFFER_KM);
print('FIRMS fire pixels (1 km):', firmsCount.get('confidence'));
print('VIIRS fire pixels (375 m):', viirsCount.get('confidence'));

// --- Map layers ---
Map.centerObject(point, 8);
Map.addLayer(point, {color: 'red'}, 'Your point');
Map.addLayer(aoi, {color: 'yellow'}, 'Analysis area', false);

Map.addLayer(
  firmsMask.selfMask(),
  {palette: ['orange', 'red']},
  'FIRMS fires (last ' + LOOKBACK_DAYS + ' days)'
);

Map.addLayer(
  viirsMask.selfMask(),
  {palette: ['yellow', 'red']},
  'VIIRS fires (last ' + LOOKBACK_DAYS + ' days)',
  false
);
```

**Expected output (Console):** pixel counts for FIRMS and VIIRS within your buffer. During active fire season near peatlands, counts may be in the hundreds or thousands. During wet season, counts are often zero.

---

## Limitations

- **FIRMS is exploratory**, not science-quality. Confidence values vary by region.
- **VIIRS archive starts 2023** — use FIRMS for longer historical context.
- A "fire pixel" is not one fire — it is one satellite grid cell flagged as burning.
- Cloud cover can hide fires; dry-season haze can also affect detection.
- Increase `LOOKBACK_DAYS` or `BUFFER_KM` to widen the search area.

---

## What's next

- [Deforestation](./05-borneo-deforestation.md) — forest loss near the same coordinates
- [Weather](./09-borneo-weather.md) — forecast precipitation and wind (dry/wet season context)
