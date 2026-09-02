# Borneo — CO2 & Carbon Indicators

Copy-paste script for carbon-related signals near any point or region in Borneo. **Important:** direct atmospheric CO2 (ppm) from satellites like OCO-2 is **not** in the public Earth Engine catalog — this guide uses the best available proxies.

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block (point or polygon), and click **Run**.

---

## What this measures

For Borneo's forests and peatlands, carbon dynamics matter for both climate and fire emissions. This script reports:

1. **GPP (Gross Primary Production)** — how much carbon vegetation absorbs (MODIS)
2. **Total column CO** — atmospheric carbon monoxide from CAMS (combustion/biomass burning proxy)

These are **indicators**, not direct atmospheric CO2 concentration readings. In polygon mode, values are **regional means** over your area.

---

## Datasets

### MODIS Gross Primary Productivity

| Property | Value |
|----------|-------|
| Catalog ID | `MODIS/061/MOD17A2H` |
| Type | `ImageCollection` (8-day) |
| Band used | `Gpp` |
| Units | kg C/m² (scale 0.0001 applied in script) |
| Resolution | 500 m |
| Best for | Vegetation carbon uptake, forest productivity |

Catalog: [MODIS/061/MOD17A2H](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD17A2H)

### CAMS Near-Real-Time (CO proxy)

| Property | Value |
|----------|-------|
| Catalog ID | `ECMWF/CAMS/NRT` |
| Type | `ImageCollection` (forecast) |
| Band used | `total_column_carbon_monoxide_surface` |
| Units | kg/m² (total column) |
| Resolution | ~45 km |
| Best for | Combustion air pollution proxy (fires, industry) |

Catalog: [ECMWF/CAMS/NRT](https://developers.google.com/earth-engine/datasets/catalog/ECMWF_CAMS_NRT)

---

## Geometry modes

- **Point mode:** set `GEOMETRY_MODE = 'point'`, edit `LNG`, `LAT`, and `BUFFER_KM`
- **Polygon mode:** set `GEOMETRY_MODE = 'polygon'`, paste coordinates into `POLYGON_COORDS` (closed ring: first point = last point)
- GPP and CO use the point in point mode, or **regional mean** over the polygon in polygon mode

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

// --- MODIS GPP (vegetation carbon uptake) ---
var gppCollection = ee.ImageCollection('MODIS/061/MOD17A2H')
  .filterDate('2023-01-01', '2024-01-01')
  .select('Gpp');

var gppMean = gppCollection.mean().multiply(0.0001);

var gppStats = gppMean.reduceRegion({
  reducer: sampleReducer,
  geometry: sampleGeom,
  scale: 500,
  maxPixels: 1e9
});

// --- CAMS CO (combustion proxy) ---
var cams = ee.ImageCollection('ECMWF/CAMS/NRT')
  .filterDate(ee.Date(Date.now()).advance(-7, 'day'), ee.Date(Date.now()))
  .select('total_column_carbon_monoxide_surface')
  .sort('system:time_start', false)
  .first();

var coStats = cams.reduceRegion({
  reducer: sampleReducer,
  geometry: sampleGeom,
  scale: 45000,
  maxPixels: 1e9
});

print('=== Carbon indicators (NOT direct CO2 ppm) ===');
print('Geometry mode:', GEOMETRY_MODE);
print('Mean GPP 2023 (kg C/m², point or regional mean):', gppStats.get('Gpp'));
print('CAMS total column CO (kg/m², point or regional mean):',
      coStats.get('total_column_carbon_monoxide_surface'));
print('Note: OCO-2 XCO2 is not in the public EE catalog.');

// --- Map layers ---
Map.centerObject(aoi, GEOMETRY_MODE === 'polygon' ? 6 : 8);
Map.addLayer(aoi, {color: 'yellow'}, 'Analysis area');
Map.addLayer(point, {color: 'red'}, 'Point (point mode only)', GEOMETRY_MODE === 'point');

Map.addLayer(
  gppMean,
  {min: 0, max: 0.012, palette: ['#ffffcc', '#41b6c4', '#253494']},
  'Mean GPP 2023 (kg C/m²)'
);

Map.addLayer(
  cams,
  {min: 0, max: 0.05, palette: ['white', 'yellow', 'orange', 'red']},
  'CAMS CO column (combustion proxy)',
  false
);
```

**Expected output (Console):**

- `Gpp`: typically 0.002–0.012 kg C/m² for tropical forest (higher = more productive vegetation)
- `total_column_carbon_monoxide_surface`: rises during haze/fire season; near zero in clean wet-season air

---

## Why not direct CO2?

Satellite column CO2 (e.g. NASA OCO-2 XCO2) requires custom asset upload to Earth Engine. The public catalog offers:

| What you want | Available in EE? | This script uses |
|---------------|------------------|------------------|
| Atmospheric CO2 ppm | No (OCO-2 not in catalog) | — |
| Vegetation carbon uptake | Yes | MODIS GPP |
| Fire/combustion signal | Yes (proxy) | CAMS CO column |
| Ocean surface pCO2 | Yes (coastal only) | Not included — see [Copernicus ocean CO2](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_MARINE_GLOBAL_ANALYSISFORECAST_BGC_001_028_CO2) |

---

## Limitations

- **GPP is not CO2 emissions** — it measures plant uptake, not atmospheric concentration.
- **CO is a combustion proxy**, not CO2 — correlated with fires but not equivalent.
- **CAMS resolution ~45 km** — smooths local point sources.
- **MODIS GPP** has gaps from clouds; annual mean reduces noise.
- **Large polygons** may hit `maxPixels` limits — increase `scale` or simplify geometry if the script errors.
- For official CO2 measurements, use ground stations or NASA GES DISC OCO-2 products outside Earth Engine.

---

## What's next

- [Wildfire](./04-borneo-wildfire.md) — fires drive CO and CO2 emissions during haze events
- [Deforestation](./05-borneo-deforestation.md) — forest loss reduces future carbon uptake (GPP)
