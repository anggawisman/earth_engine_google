# Borneo — Wildfire Monitoring

Copy-paste script for active fire detections near any point or region in Borneo. Defaults to central Kalimantan (a common peat-fire zone).

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block (point or polygon), and click **Run**.

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

## Geometry modes

- **Point mode:** set `GEOMETRY_MODE = 'point'`, edit `LNG`, `LAT`, and `BUFFER_KM`
- **Polygon mode:** set `GEOMETRY_MODE = 'polygon'`, paste coordinates into `POLYGON_COORDS` (closed ring: first point = last point)
- Earth Engine uses `[longitude, latitude]` — same order as GeoJSON
- `geodesic: false` from exported GeoJSON is fine; `ee.Geometry.Polygon` uses geodesic edges by default (acceptable for regional Borneo boxes)

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

var LOOKBACK_DAYS = 30;
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = GEOMETRY_MODE === 'polygon'
  ? ee.Geometry.Polygon([POLYGON_COORDS])
  : point.buffer(BUFFER_KM * 1000);

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
print('Geometry mode:', GEOMETRY_MODE);
print('Lookback days:', LOOKBACK_DAYS);
print('FIRMS fire pixels (1 km):', firmsCount.get('confidence'));
print('VIIRS fire pixels (375 m):', viirsCount.get('confidence'));

// --- Map layers ---
Map.centerObject(aoi, GEOMETRY_MODE === 'polygon' ? 6 : 8);
Map.addLayer(aoi, {color: 'yellow'}, 'Analysis area');
Map.addLayer(point, {color: 'red'}, 'Point (point mode only)', GEOMETRY_MODE === 'point');

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

**Expected output (Console):** pixel counts for FIRMS and VIIRS within your analysis area (buffer or polygon). During active fire season near peatlands, counts may be in the hundreds or thousands. During wet season, counts are often zero.

---

## Limitations

- **FIRMS is exploratory**, not science-quality. Confidence values vary by region.
- **VIIRS archive starts 2023** — use FIRMS for longer historical context.
- A "fire pixel" is not one fire — it is one satellite grid cell flagged as burning.
- Cloud cover can hide fires; dry-season haze can also affect detection.
- **Large polygons** may hit `maxPixels` limits — increase `scale` or simplify geometry if the script errors.
- Increase `LOOKBACK_DAYS` or widen the analysis area to expand the search.

---

## What's next

- [Deforestation](./05-borneo-deforestation.md) — forest loss near the same area
- [Weather](./09-borneo-weather.md) — forecast precipitation and wind (dry/wet season context)
