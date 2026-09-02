# Borneo — Deforestation Monitoring

Copy-paste script for forest cover and loss near any point or region in Borneo. Uses Hansen Global Forest Change (annual) and GLAD alerts (near real-time).

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block (point or polygon), and click **Run**.

---

## What this measures

Borneo has experienced large-scale forest conversion for palm oil, logging, and mining. This script reports:

1. **Tree cover %** at your point or regional mean (year 2000 baseline)
2. **Forest loss area** within your analysis area since 2000 (Hansen)
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

## Geometry modes

- **Point mode:** set `GEOMETRY_MODE = 'point'`, edit `LNG`, `LAT`, and `BUFFER_KM`
- **Polygon mode:** set `GEOMETRY_MODE = 'polygon'`, paste coordinates into `POLYGON_COORDS` (closed ring: first point = last point)
- Earth Engine uses `[longitude, latitude]` — same order as GeoJSON
- Tree cover uses the point value in point mode, or **regional mean** over the polygon in polygon mode

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

var GLAD_CONF_BAND = 'conf26';  // update yearly: conf24, conf25, conf26, etc.
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = GEOMETRY_MODE === 'polygon'
  ? ee.Geometry.Polygon([POLYGON_COORDS])
  : point.buffer(BUFFER_KM * 1000);

var sampleGeom = GEOMETRY_MODE === 'polygon' ? aoi : point;
var sampleReducer = GEOMETRY_MODE === 'polygon'
  ? ee.Reducer.mean()
  : ee.Reducer.first();

// --- Hansen Global Forest Change ---
var hansen = ee.Image('UMD/hansen/global_forest_change_2025_v1_13');
var treeCover = hansen.select('treecover2000');
var loss = hansen.select('loss');
var pixelArea = ee.Image.pixelArea();

var treeCoverStats = treeCover.reduceRegion({
  reducer: sampleReducer,
  geometry: sampleGeom,
  scale: 30,
  maxPixels: 1e10
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
print('Geometry mode:', GEOMETRY_MODE);
print('Tree cover (%, year 2000, point or regional mean):',
      treeCoverStats.get('treecover2000'));
print('Forest loss area since 2000 (ha):', lossHa);
print('GLAD alert pixels in area:', gladCount.get(GLAD_CONF_BAND));
print('GLAD band used:', GLAD_CONF_BAND);

// --- Map layers ---
Map.centerObject(aoi, GEOMETRY_MODE === 'polygon' ? 6 : 9);
Map.addLayer(aoi, {color: 'yellow'}, 'Analysis area');
Map.addLayer(point, {color: 'red'}, 'Point (point mode only)', GEOMETRY_MODE === 'point');

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
- `Forest loss area`: hectares lost within analysis area since 2000
- `GLAD alert pixels`: count of recent disturbance pixels (0 if none detected)

---

## Limitations

- **Hansen loss is annual** — not same-day alerts. Use GLAD for recent events.
- **GLAD confidence bands change yearly** — update `GLAD_CONF_BAND` (e.g. `conf24`, `conf25`) when UMD rotates bands.
- **30 m resolution** misses very small clearings and may confuse cloud/shadow with loss.
- **Tree cover 2000** is the baseline; it does not show current cover directly (use loss + baseline to infer).
- **Large polygons** may hit `maxPixels` limits — increase `scale` or simplify geometry if the script errors.
- Plantation conversion may show as forest loss even when land remains vegetated (oil palm).

---

## What's next

- [Wildfire](./04-borneo-wildfire.md) — fires often follow or accompany dry-season land clearing
- [Climate change](./07-borneo-climate-change.md) — long-term temperature trends in the same area
