# Borneo — Deforestation Monitoring

Copy-paste script for forest cover and loss near any point in Borneo. Uses Hansen Global Forest Change (annual) and GLAD alerts (near real-time).

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block, and click **Run**.

---

## What this measures

Borneo has experienced large-scale forest conversion for palm oil, logging, and mining. This script reports:

1. **Tree cover %** at your point (year 2000 baseline)
2. **Forest loss area** within your buffer since 2000 (Hansen)
3. **Recent GLAD alert pixels** — near-real-time disturbance detections

---

## Datasets

### Hansen Global Forest Change

| Property | Value |
|----------|-------|
| Catalog ID | `UMD/hansen/global_forest_change_2025_v1_13` |
| Type | `Image` (static mosaic) |
| Bands used | `treecover2000`, `loss`, `lossyear` |
| Resolution | ~30 m |
| Update cadence | Annual (`lossyear` updated yearly) |
| Best for | Historical forest loss totals, annual loss year |

Catalog: [Hansen GFC v1.13](https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2025_v1_13)

### GLAD Forest Alerts

| Property | Value |
|----------|-------|
| Catalog ID | `projects/glad/alert/UpdResult` |
| Type | `ImageCollection` |
| Bands used | `confYY` (confidence, year-specific) |
| Resolution | ~30 m |
| Update cadence | Near real-time (tropics) |
| Best for | Recent disturbance alerts |

Reference: [GLAD Forest Alerts](https://glad.geog.umd.edu/index.php/dataset/glad-forest-alerts)

---

## Code Editor

```javascript
// ========== CUSTOMIZE (only edit this block) ==========
var LNG = 113.9;      // longitude — Earth Engine uses [lng, lat]
var LAT = -2.2;       // latitude
var BUFFER_KM = 50;   // analysis radius around the point
var GLAD_CONF_BAND = 'conf26';  // update yearly: conf24, conf25, conf26, etc.
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = point.buffer(BUFFER_KM * 1000);

// --- Hansen Global Forest Change ---
var hansen = ee.Image('UMD/hansen/global_forest_change_2025_v1_13');
var treeCover = hansen.select('treecover2000');
var loss = hansen.select('loss');
var pixelArea = ee.Image.pixelArea();

var treeCoverAtPoint = treeCover.reduceRegion({
  reducer: ee.Reducer.first(),
  geometry: point,
  scale: 30
});

var lossAreaM2 = loss.multiply(pixelArea).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e10
});

var lossHa = ee.Number(lossAreaM2.get('loss')).divide(10000);

// --- GLAD alerts (near real-time) ---
var gladAlerts = ee.ImageCollection('projects/glad/alert/UpdResult')
  .filterBounds(aoi);

var gladConf = gladAlerts.select(GLAD_CONF_BAND).mosaic();
var gladMask = gladConf.gt(0);

var gladCount = gladMask.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e10
});

print('=== Deforestation summary ===');
print('Tree cover at point (%, year 2000):', treeCoverAtPoint.get('treecover2000'));
print('Forest loss area since 2000 (ha):', lossHa);
print('GLAD alert pixels in buffer:', gladCount.get(GLAD_CONF_BAND));
print('GLAD band used:', GLAD_CONF_BAND);

// --- Map layers ---
Map.centerObject(point, 9);
Map.addLayer(point, {color: 'red'}, 'Your point');
Map.addLayer(aoi, {color: 'yellow'}, 'Analysis area', false);

Map.addLayer(
  treeCover,
  {min: 0, max: 100, palette: ['#f7f7f7', '#006400']},
  'Tree cover 2000 (%)'
);

Map.addLayer(
  loss.selfMask(),
  {palette: ['red']},
  'Forest loss since 2000',
  false
);

Map.addLayer(
  gladMask.selfMask(),
  {palette: ['yellow', 'orange', 'red']},
  'GLAD alerts (' + GLAD_CONF_BAND + ')',
  false
);
```

**Expected output (Console):**

- `treecover2000`: 0–100 (dense forest often 60–90+ in interior Borneo; cleared land near 0)
- `Forest loss area`: hectares lost within buffer since 2000
- `GLAD alert pixels`: count of recent disturbance pixels (0 if none detected)

---

## Limitations

- **Hansen loss is annual** — not same-day alerts. Use GLAD for recent events.
- **GLAD confidence bands change yearly** — update `GLAD_CONF_BAND` (e.g. `conf24`, `conf25`) when UMD rotates bands.
- **30 m resolution** misses very small clearings and may confuse cloud/shadow with loss.
- **Tree cover 2000** is the baseline; it does not show current cover directly (use loss + baseline to infer).
- Plantation conversion may show as forest loss even when land remains vegetated (oil palm).

---

## What's next

- [Wildfire](./04-borneo-wildfire.md) — fires often follow or accompany dry-season land clearing
- [Climate change](./07-borneo-climate-change.md) — long-term temperature trends in the same area
