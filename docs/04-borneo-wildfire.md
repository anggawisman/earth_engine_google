# Borneo — Wildfire Monitoring

Copy-paste script for active fire detections within any area you draw on the map in Borneo.

Open [code.earthengine.google.com](https://code.earthengine.google.com), draw your area, paste the imported `geometry` variable, set dates in the **CUSTOMIZE** block, and click **Run**. See [Satellite preview](#satellite-preview), [Export static image](#export-static-image), or [Export video timelapse](#export-video-timelapse) below.

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

### Sentinel-2 SR (satellite background — static image)

| Property | Value |
|----------|-------|
| Catalog ID | `COPERNICUS/S2_SR_HARMONIZED` |
| Type | `ImageCollection` |
| Bands used | `B4`, `B3`, `B2` (true color) |
| Resolution | 10 m |
| Best for | Map base layer and static image export |

Catalog: [Sentinel-2 SR Harmonized](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)

### MODIS Terra SR (satellite background — video)

| Property | Value |
|----------|-------|
| Catalog ID | `MODIS/061/MOD09GA` |
| Type | `ImageCollection` |
| Bands used | `sur_refl_b01`, `sur_refl_b04`, `sur_refl_b03` (true color) |
| Resolution | ~500 m |
| Update cadence | Daily |
| Best for | Daily true-color frames in video timelapse |

Catalog: [MOD09GA](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD09GA)

---

## Draw your analysis area

1. Open [code.earthengine.google.com](https://code.earthengine.google.com/)
2. Click the **geometry tool** (rectangle or polygon) on the map toolbar
3. Draw your area of interest on the map
4. Open the **Imports** tab — your shape appears as `geometry`
5. Click the import to add it to the script (or copy the `ee.Geometry.Polygon(...)` block)
6. Replace the placeholder `geometry` in the **CUSTOMIZE** block
7. Set dates → click **Run**

Earth Engine uses `[longitude, latitude]`. `geodesic: false` from the draw tool is valid.

The draw tool sets the **spatial area** only. Date range comes from `DATE_MODE` (`START_DATE`/`END_DATE` or `LOOKBACK_DAYS`).

---

## Date modes

- **Range mode:** set `DATE_MODE = 'range'`, edit `START_DATE` and `END_DATE` (for historical analysis and exports)
- **Lookback mode:** set `DATE_MODE = 'lookback'`, edit `LOOKBACK_DAYS` (quick monitoring relative to today)
- `END_DATE` is **exclusive** in range mode — add one day to include the last calendar day

---

## Code Editor

```javascript
// ========== CUSTOMIZE (only edit this block) ==========
// Paste from Code Editor Imports after drawing on the map
var geometry = ee.Geometry.Polygon(
  [[[113.5, -2.5], [114.5, -2.5], [114.5, -1.5], [113.5, -1.5], [113.5, -2.5]]],
  null,
  false
);

var DATE_MODE = 'lookback'; // 'range' | 'lookback'

// Explicit range (DATE_MODE = 'range')
var START_DATE = '2025-08-01';  // inclusive
var END_DATE   = '2025-09-01';  // exclusive — add 1 day to include last calendar day

// Relative lookback (DATE_MODE = 'lookback')
var LOOKBACK_DAYS = 30;

var INCLUDE_SATELLITE = true; // false = fire-only layers and exports
// ======================================================

var aoi = geometry;

var startDate = DATE_MODE === 'range'
  ? ee.Date(START_DATE)
  : ee.Date(Date.now()).advance(-LOOKBACK_DAYS, 'day');

var endDate = DATE_MODE === 'range'
  ? ee.Date(END_DATE)
  : ee.Date(Date.now());

var dateLabel = DATE_MODE === 'range'
  ? (START_DATE + ' to ' + END_DATE)
  : ('last ' + LOOKBACK_DAYS + ' days');

var exportSuffix = dateLabel.replace(/ /g, '_');

// --- Satellite visualization params ---
var s2VisParams = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};
var modisVisParams = {
  bands: ['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03'],
  min: 0, max: 3000, gamma: 1.4
};

function maskS2Clouds(image) {
  var qa = image.select('QA60');
  var cloud = 1 << 10;
  var cirrus = 1 << 11;
  return image.updateMask(
    qa.bitwiseAnd(cloud).eq(0).and(qa.bitwiseAnd(cirrus).eq(0))
  );
}

var s2Composite = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .map(maskS2Clouds)
  .median()
  .clip(aoi);

var s2Rgb = s2Composite.visualize(s2VisParams);

function maskModisClouds(image) {
  var qa = image.select('state_1km');
  var cloudBit = 1 << 10;
  return image.updateMask(qa.bitwiseAnd(cloudBit).eq(0));
}

var modis = ee.ImageCollection('MODIS/061/MOD09GA')
  .filterBounds(aoi)
  .filterDate(startDate, endDate)
  .map(maskModisClouds);

var modisMedian = modis.median().clip(aoi);

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
print('Analysis area: drawn polygon');
print('Drawn area (km²):', geometry.area(1).divide(1e6));
print('Drawn bounds:', geometry.bounds());
print('Date mode:', DATE_MODE);
print('Date range:', dateLabel);
print('Satellite background:', INCLUDE_SATELLITE);
print('FIRMS fire pixels (1 km):', firmsCount.get('confidence'));
print('VIIRS fire pixels (375 m):', viirsCount.get('confidence'));

// --- Map layers ---
Map.centerObject(aoi, 6);
Map.addLayer(s2Rgb, {}, 'Sentinel-2 true color', INCLUDE_SATELLITE);
Map.addLayer(aoi, {color: 'yellow'}, 'Drawn analysis area');

Map.addLayer(
  firmsMask.selfMask(),
  {palette: ['orange', 'red']},
  'FIRMS fires (' + dateLabel + ')'
);

Map.addLayer(
  viirsMask.selfMask(),
  {palette: ['yellow', 'red']},
  'VIIRS fires (' + dateLabel + ')',
  false
);

// --- Export static image (composite of all days) ---
var fireVis = firmsMask.selfMask().visualize({
  palette: ['orange', 'red'],
  forceRgbOutput: true
});
var staticComposite = INCLUDE_SATELLITE
  ? s2Rgb.blend(fireVis)
  : fireVis;

print('Image preview URL:', staticComposite.getThumbURL({
  dimensions: 512,
  region: aoi,
  format: 'png'
}));

Export.image.toDrive({
  image: staticComposite,
  description: (INCLUDE_SATELLITE ? 'firms_fires_satellite_' : 'firms_fires_') + exportSuffix,
  folder: 'earth_engine_exports',
  region: aoi,
  scale: INCLUDE_SATELLITE ? 10 : 1000,
  maxPixels: 1e9
});

// --- Export video timelapse (one frame per day) ---
function visFirmsFrameWithSatellite(firmsImg) {
  var fire = firmsImg.select('confidence').gt(0).selfMask();
  var fireVis = fire.visualize({
    palette: ['orange', 'red'],
    forceRgbOutput: true
  });

  if (!INCLUDE_SATELLITE) {
    return fireVis;
  }

  var t = ee.Date(firmsImg.get('system:time_start'));
  var modisColDay = modis.filterDate(t, t.advance(1, 'day'));
  var sat = ee.Image(ee.Algorithms.If(
    modisColDay.size().gt(0),
    modisColDay.first().visualize(modisVisParams),
    modisMedian.visualize(modisVisParams)
  ));
  return sat.blend(fireVis);
}

var firmsFrames = firms.map(visFirmsFrameWithSatellite);

Export.video.toDrive({
  collection: firmsFrames,
  description: 'firms_timelapse_' + exportSuffix,
  folder: 'earth_engine_exports',
  region: aoi,
  scale: 1000,
  framesPerSecond: 2,
  maxFrames: 300
});

// --- Quick preview (optional — no Drive export) ---
var videoArgs = {
  dimensions: 512,
  region: aoi,
  framesPerSecond: 2
};
print('Video preview URL:', firmsFrames.getVideoThumbURL(videoArgs));

// Or inline in the Code Editor map panel:
// ui.Thumbnail({image: staticComposite, params: {dimensions: 512, region: aoi}, style: {width: '600px'}})
// ui.Thumbnail({image: firmsFrames, params: videoArgs, style: {width: '600px'}})
```

**Expected output (Console):** drawn area (km²), bounds, pixel counts for FIRMS and VIIRS within your drawn shape, plus **image** and **video** preview URLs when `INCLUDE_SATELLITE = true`. During active fire season near peatlands, counts may be in the hundreds or thousands. During wet season, counts are often zero.

---

## Satellite preview

Set `INCLUDE_SATELLITE = true` in the **CUSTOMIZE** block to see fires overlaid on satellite imagery — in the map, via browser preview URLs, and in Drive exports.

| Output | Satellite source | What you see |
|--------|------------------|--------------|
| Map base layer | Sentinel-2 true color (cloud-masked median) | 10 m context under fire layers |
| Static image preview + export | Sentinel-2 + FIRMS blend | One PNG/GeoTIFF with fires on satellite |
| Video preview + export | MODIS daily true color + FIRMS per frame | Daily animation with satellite background |

Set `INCLUDE_SATELLITE = false` to revert to fire-only layers and exports (original behavior).

### Preview URLs (console)

After clicking **Run**, the console prints:

- **Image preview URL** — click to open a PNG of the static composite (Sentinel-2 + fires)
- **Video preview URL** — click to open an animated preview (MODIS daily + fires)

For inline previews in the Code Editor panel, uncomment the `ui.Thumbnail` lines at the bottom of the script.

---

## Export static image

Export a single **GeoTIFF** showing all fire detections across your date range. With `INCLUDE_SATELLITE = true`, fires are blended over a Sentinel-2 true-color composite.

Earth Engine does not download directly to your laptop. The script registers a **batch task** that renders on Google's servers and writes to **Google Drive**.

### Image export code

Already included at the bottom of the script above:

```javascript
var fireVis = firmsMask.selfMask().visualize({
  palette: ['orange', 'red'],
  forceRgbOutput: true
});
var staticComposite = INCLUDE_SATELLITE
  ? s2Rgb.blend(fireVis)
  : fireVis;

print('Image preview URL:', staticComposite.getThumbURL({
  dimensions: 512,
  region: aoi,
  format: 'png'
}));

Export.image.toDrive({
  image: staticComposite,
  description: (INCLUDE_SATELLITE ? 'firms_fires_satellite_' : 'firms_fires_') + exportSuffix,
  folder: 'earth_engine_exports',
  region: aoi,
  scale: INCLUDE_SATELLITE ? 10 : 1000,
  maxPixels: 1e9
});
```

| Property | Value |
|----------|-------|
| Method | `Export.image.toDrive` |
| File type | GeoTIFF (RGB when satellite enabled) |
| Resolution | 10 m (satellite) or 1000 m (fire-only) |
| Output folder | `earth_engine_exports` on Google Drive |

### Image preview

Click the **Image preview URL** in the console to open a PNG before running the Drive export. No task needed — Earth Engine renders on-the-fly in your browser.

### Image export workflow

1. Draw your area on the map and paste `geometry` into the **CUSTOMIZE** block.
2. Set `DATE_MODE`, date variables, and `INCLUDE_SATELLITE`.
3. Click **Run** — confirm the map shows Sentinel-2 base + fire overlay (if satellite enabled).
4. Click the **Image preview URL** in the console to verify the composite.
5. Open the **Tasks** tab → find `firms_fires_satellite_*` or `firms_fires_*`.
6. Click **Run** on the image task.
7. When complete, open Google Drive → `earth_engine_exports` → download the GeoTIFF.

For VIIRS, repeat the same blend pattern using `viirsMask` at `scale: 375`.

### Image export limitations

- **Large polygons** may hit `maxPixels` limits — increase `scale` (e.g. 100 instead of 10) or simplify geometry.
- **S2 median may look hazy** during dry-season smoke in Borneo — expected.
- **S2 export at 10 m** over large AOIs may timeout — use `scale: 100` for regional polygons.
- **`filterDate` end is exclusive** in range mode — add one day to `END_DATE` to include the last calendar day.
- Export is async — check the Tasks tab for completion status.

Official reference: [Exporting Images](https://developers.google.com/earth-engine/guides/exporting_images), [Image Visualization](https://developers.google.com/earth-engine/guides/image_visualization)

---

## Export video timelapse

Export an **MP4** with one frame per daily FIRMS image. With `INCLUDE_SATELLITE = true`, each frame blends fires over MODIS daily true color (fallback to median when a day is fully cloudy).

### Video export code

Already included at the bottom of the script above:

```javascript
function visFirmsFrameWithSatellite(firmsImg) {
  var fire = firmsImg.select('confidence').gt(0).selfMask();
  var fireVis = fire.visualize({
    palette: ['orange', 'red'],
    forceRgbOutput: true
  });

  if (!INCLUDE_SATELLITE) {
    return fireVis;
  }

  var t = ee.Date(firmsImg.get('system:time_start'));
  var modisColDay = modis.filterDate(t, t.advance(1, 'day'));
  var sat = ee.Image(ee.Algorithms.If(
    modisColDay.size().gt(0),
    modisColDay.first().visualize(modisVisParams),
    modisMedian.visualize(modisVisParams)
  ));
  return sat.blend(fireVis);
}

var firmsFrames = firms.map(visFirmsFrameWithSatellite);

Export.video.toDrive({
  collection: firmsFrames,
  description: 'firms_timelapse_' + exportSuffix,
  folder: 'earth_engine_exports',
  region: aoi,
  scale: 1000,
  framesPerSecond: 2,
  maxFrames: 300
});
```

| Property | Value |
|----------|-------|
| Method | `Export.video.toDrive` |
| File type | MP4 |
| Frames | One per daily FIRMS image (+ MODIS background when enabled) |
| Framerate | 2 fps (adjust `framesPerSecond`) |
| Output folder | `earth_engine_exports` on Google Drive |

### Video preview (no Drive export)

Before running the full export, click the **Video preview URL** in the console:

```javascript
var videoArgs = {
  dimensions: 512,
  region: aoi,
  framesPerSecond: 2
};
print('Video preview URL:', firmsFrames.getVideoThumbURL(videoArgs));

// Or inline in the Code Editor map panel:
// ui.Thumbnail({image: firmsFrames, params: videoArgs, style: {width: '600px'}})
```

### Video export workflow

1. Draw your area on the map and paste `geometry` into the **CUSTOMIZE** block.
2. Set `DATE_MODE`, date variables, and `INCLUDE_SATELLITE`.
3. Click **Run** — click the **Video preview URL** in the console first.
4. Open the **Tasks** tab → find `firms_timelapse_*`.
5. Click **Run** on the video task.
6. When complete, open Google Drive → `earth_engine_exports` → download the MP4.

For higher quality, increase `scale` or use `dimensions` instead (mutually exclusive with `scale`).

### Video export limitations

- **RGB 8-bit required** — raw single-band images cannot export as video; the script uses `.visualize({ forceRgbOutput: true })`.
- **`maxFrames` caps length** — default limit is 1000; the script sets 300. Raise for longer ranges or split into multiple exports.
- **MODIS ~500 m** — fires at 1 km (FIRMS) may not align pixel-perfect with satellite.
- **Cloudy days** — frames without clear MODIS use the median composite as fallback (static background for that day).
- **FIRMS = 1 km grid** — timelapse shows daily snapshots, not continuous flames.
- **Export is async** — video tasks can take minutes; use `getVideoThumbURL` for a quick preview first.

Official reference: [Exporting Video and Animations](https://developers.google.com/earth-engine/guides/exporting_video), [MOD09GA catalog](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD09GA)

---

## Limitations

- **FIRMS is exploratory**, not science-quality. Confidence values vary by region.
- **VIIRS archive starts 2023** — use FIRMS for longer historical context.
- A "fire pixel" is not one fire — it is one satellite grid cell flagged as burning.
- Cloud cover can hide fires; dry-season haze can also affect detection.
- **Large drawn rectangles** may hit `maxPixels` limits on export — increase `scale` if Tasks fail.

---

## What's next

- [Deforestation](./05-borneo-deforestation.md) — forest loss near the same area
- [Weather](./09-borneo-weather.md) — forecast precipitation and wind (dry/wet season context)
