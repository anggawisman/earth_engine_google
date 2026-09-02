# Borneo — Tectonic & Volcanic Activity

Copy-paste script for earthquake history and thermal hotspots near any point in Borneo.

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block, and click **Run**.

---

## What this measures

Borneo sits on the Sunda Plate with lower seismicity than the Ring of Fire (Sulawesi, Philippines, Java). Still, earthquakes occur in Sabah, Kalimantan, and offshore. This script checks:

1. **USGS earthquakes** — events within your buffer (magnitude and date filtered)
2. **VIIRS thermal hotspots** — possible volcanic or industrial heat sources (last 30 days)

Nearest known volcanoes in Borneo are limited (e.g. Bombalai in Sabah); most thermal pixels near your point are more likely fires or industry than volcanoes.

---

## Datasets

### USGS Global Earthquakes (community catalog)

| Property | Value |
|----------|-------|
| Catalog ID | `projects/sat-io/open-datasets/USGS/usgs_earthquakes` |
| Type | `FeatureCollection` |
| Key properties | `mag`, `place`, `time`, `depth` |
| Best for | Historical earthquake events near a location |

Source: [GEE Community Catalog — USGS Earthquakes](https://gee-community-catalog.org/projects/global_earthquakes/)

> This is a **community-hosted** dataset, not an official Google catalog product. Attribute USGS when publishing results.

### VIIRS Thermal (active fire product)

| Property | Value |
|----------|-------|
| Catalog ID | `NASA/LANCE/SNPP_VIIRS/C2` |
| Type | `ImageCollection` |
| Bands used | `Bright_ti4`, `confidence` |
| Resolution | 375 m |
| Best for | Thermal anomaly mapping (fires, volcanoes, industry) |

Catalog: [NASA/LANCE/SNPP_VIIRS/C2](https://developers.google.com/earth-engine/datasets/catalog/NASA_LANCE_SNPP_VIIRS_C2)

---

## Code Editor

```javascript
// ========== CUSTOMIZE (only edit this block) ==========
var LNG = 113.9;      // longitude — Earth Engine uses [lng, lat]
var LAT = -2.2;       // latitude
var BUFFER_KM = 200;  // wider buffer helps find regional earthquakes
var MIN_MAGNITUDE = 4.5;
var LOOKBACK_YEARS = 10;
var THERMAL_LOOKBACK_DAYS = 30;
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = point.buffer(BUFFER_KM * 1000);

var startDate = ee.Date(Date.now()).advance(-LOOKBACK_YEARS, 'year');
var endDate = ee.Date(Date.now());

// --- USGS earthquakes ---
var quakes = ee.FeatureCollection('projects/sat-io/open-datasets/USGS/usgs_earthquakes')
  .filterBounds(aoi)
  .filter(ee.Filter.gte('mag', MIN_MAGNITUDE))
  .filter(ee.Filter.date(startDate, endDate));

var quakeCount = quakes.size();

// Distance from point to each quake (km)
var quakesWithDist = quakes.map(function(f) {
  var epicenter = f.geometry();
  var distM = point.distance(epicenter);
  return f.set('distance_km', distM.divide(1000));
});

var nearest = quakesWithDist.sort('distance_km').first();

print('=== Tectonic summary ===');
print('Earthquakes (mag >= ' + MIN_MAGNITUDE + ', last ' + LOOKBACK_YEARS + ' yr):',
      quakeCount);
print('Nearest earthquake:', nearest);

// --- VIIRS thermal hotspots ---
var thermalStart = endDate.advance(-THERMAL_LOOKBACK_DAYS, 'day');
var viirs = ee.ImageCollection('NASA/LANCE/SNPP_VIIRS/C2')
  .filterDate(thermalStart, endDate)
  .filterBounds(aoi)
  .select('Bright_ti4');

var thermalMax = viirs.max();
var thermalMask = thermalMax.gt(320);

var thermalCount = thermalMask.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 375,
  maxPixels: 1e9
});

print('Thermal hotspot pixels (VIIRS, last ' + THERMAL_LOOKBACK_DAYS + ' days):',
      thermalCount.get('Bright_ti4'));

// --- Map layers ---
Map.centerObject(point, 7);
Map.addLayer(point, {color: 'red'}, 'Your point');
Map.addLayer(aoi, {color: 'cyan'}, 'Earthquake search area', false);

Map.addLayer(
  quakes,
  {color: 'blue'},
  'Earthquakes (mag >= ' + MIN_MAGNITUDE + ')'
);

Map.addLayer(
  thermalMask.selfMask(),
  {palette: ['yellow', 'orange', 'red']},
  'Thermal hotspots (VIIRS)',
  false
);
```

**Expected output (Console):**

- Earthquake count within buffer (often low for interior Borneo)
- Nearest earthquake feature with `mag`, `place`, `depth`, `distance_km`
- Thermal pixel count (often correlates with fires, not volcanoes, in Kalimantan)

---

## Limitations

- **Borneo seismicity is relatively low** — expand `BUFFER_KM` or lower `MIN_MAGNITUDE` to find more events.
- **USGS dataset is community-hosted** — verify critical applications against [USGS Earthquake Catalog](https://earthquake.usgs.gov/) directly.
- **VIIRS thermal ≠ volcano** — most hotspots in Borneo are agricultural fires or industry.
- Earthquake `depth` and `mag` come from USGS catalog metadata; shallow events near coasts may have tsunami relevance (check official advisories separately).

---

## What's next

- [Weather](./09-borneo-weather.md) — atmospheric conditions after seismic events
- [Wildfire](./04-borneo-wildfire.md) — thermal hotspots may overlap with fire detections
