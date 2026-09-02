# Borneo — Wildfire Monitoring

Copy-paste script for active fire detections near any point or region in Borneo. Defaults to central Kalimantan (a common peat-fire zone).

Open [code.earthengine.google.com](https://code.earthengine.google.com), paste the script below, change only the **CUSTOMIZE** block (geometry mode, date mode), and click **Run**. See [Export static image](#export-static-image) or [Export video timelapse](#export-video-timelapse) below to download results to Google Drive.

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

## Date modes

- **Range mode:** set `DATE_MODE = 'range'`, edit `START_DATE` and `END_DATE` (for historical analysis and exports)
- **Lookback mode:** set `DATE_MODE = 'lookback'`, edit `LOOKBACK_DAYS` (quick monitoring relative to today)
- `END_DATE` is **exclusive** in range mode — add one day to include the last calendar day

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

var DATE_MODE = 'lookback'; // 'range' | 'lookback'

// Explicit range (DATE_MODE = 'range')
var START_DATE = '2025-08-01';  // inclusive
var END_DATE   = '2025-09-01';  // exclusive — add 1 day to include last calendar day

// Relative lookback (DATE_MODE = 'lookback')
var LOOKBACK_DAYS = 30;
// ======================================================

var point = ee.Geometry.Point([LNG, LAT]);
var aoi = GEOMETRY_MODE === 'polygon'
  ? ee.Geometry.Polygon([POLYGON_COORDS])
  : point.buffer(BUFFER_KM * 1000);

var startDate = DATE_MODE === 'range'
  ? ee.Date(START_DATE)
  : ee.Date(Date.now()).advance(-LOOKBACK_DAYS, 'day');

var endDate = DATE_MODE === 'range'
  ? ee.Date(END_DATE)
  : ee.Date(Date.now());

var dateLabel = DATE_MODE === 'range'
  ? (START_DATE + ' to ' + END_DATE)
  : ('last ' + LOOKBACK_DAYS + ' days');

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
print('Date mode:', DATE_MODE);
print('Date range:', dateLabel);
print('FIRMS fire pixels (1 km):', firmsCount.get('confidence'));
print('VIIRS fire pixels (375 m):', viirsCount.get('confidence'));

// --- Map layers ---
Map.centerObject(aoi, GEOMETRY_MODE === 'polygon' ? 6 : 8);
Map.addLayer(aoi, {color: 'yellow'}, 'Analysis area');
Map.addLayer(point, {color: 'red'}, 'Point (point mode only)', GEOMETRY_MODE === 'point');

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
var firmsComposite = firmsMask.selfMask().clip(aoi);
var exportSuffix = dateLabel.replace(/ /g, '_');

Export.image.toDrive({
  image: firmsComposite,
  description: 'firms_fires_' + exportSuffix,
  folder: 'earth_engine_exports',
  region: aoi,
  scale: 1000,
  maxPixels: 1e9
});

// --- Export video timelapse (one frame per day) ---
function visFirmsFrame(img) {
  var fire = img.select('confidence').gt(0).selfMask();
  return fire.visualize({
    palette: ['orange', 'red'],
    forceRgbOutput: true
  });
}

var firmsFrames = firms.map(visFirmsFrame);

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
print('Preview URL:', firmsFrames.getVideoThumbURL(videoArgs));

// Or inline in the Code Editor map panel:
// ui.Thumbnail({image: firmsFrames, params: videoArgs, style: {width: '600px'}})
```

**Expected output (Console):** pixel counts for FIRMS and VIIRS within your analysis area (buffer or polygon). During active fire season near peatlands, counts may be in the hundreds or thousands. During wet season, counts are often zero.

---

## Export static image

Export a single **GeoTIFF** showing all fire detections across your date range (max composite — same as the orange/red map layer).

Earth Engine does not download directly to your laptop. The script registers a **batch task** that renders on Google's servers and writes to **Google Drive**.

### Image export code

Already included at the bottom of the script above:

```javascript
var firmsComposite = firmsMask.selfMask().clip(aoi);
var exportSuffix = dateLabel.replace(/ /g, '_');

Export.image.toDrive({
  image: firmsComposite,
  description: 'firms_fires_' + exportSuffix,
  folder: 'earth_engine_exports',
  region: aoi,
  scale: 1000,
  maxPixels: 1e9
});
```

| Property | Value |
|----------|-------|
| Method | `Export.image.toDrive` |
| File type | GeoTIFF |
| Resolution | 1000 m (matches FIRMS) |
| Output folder | `earth_engine_exports` on Google Drive |

### Image export workflow

1. Set `DATE_MODE` and the corresponding date variables in the **CUSTOMIZE** block.
2. Click **Run** — confirm the FIRMS layer on the map looks correct.
3. Open the **Tasks** tab → find `firms_fires_*`.
4. Click **Run** on the image task.
5. When complete, open Google Drive → `earth_engine_exports` → download the GeoTIFF.

For VIIRS, repeat the same pattern using `viirsMask` at `scale: 375`.

### Image export limitations

- **Large polygons** may hit `maxPixels` limits — increase `scale` (e.g. 2000 m) or simplify geometry.
- **`filterDate` end is exclusive** in range mode — add one day to `END_DATE` to include the last calendar day.
- Export is async — check the Tasks tab for completion status.

Official reference: [Exporting Images](https://developers.google.com/earth-engine/guides/exporting_images)

---

## Export video timelapse

Export an **MP4** with one frame per daily FIRMS image, animated over your date range.

### Video export code

Already included at the bottom of the script above:

```javascript
function visFirmsFrame(img) {
  var fire = img.select('confidence').gt(0).selfMask();
  return fire.visualize({
    palette: ['orange', 'red'],
    forceRgbOutput: true
  });
}

var firmsFrames = firms.map(visFirmsFrame);

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
| Frames | One per daily FIRMS image |
| Framerate | 2 fps (adjust `framesPerSecond`) |
| Output folder | `earth_engine_exports` on Google Drive |

### Quick preview (no Drive export)

Before running the full export, preview the animation in your browser:

```javascript
var videoArgs = {
  dimensions: 512,
  region: aoi,
  framesPerSecond: 2
};
print('Preview URL:', firmsFrames.getVideoThumbURL(videoArgs));

// Or inline in the Code Editor map panel:
// ui.Thumbnail({image: firmsFrames, params: videoArgs, style: {width: '600px'}})
```

Click the preview URL in the console, or right-click the thumbnail to save.

### Video export workflow

1. Set `DATE_MODE` and the corresponding date variables in the **CUSTOMIZE** block.
2. Click **Run** — check the preview URL in the console first.
3. Open the **Tasks** tab → find `firms_timelapse_*`.
4. Click **Run** on the video task.
5. When complete, open Google Drive → `earth_engine_exports` → download the MP4.

For higher quality, increase `scale` or use `dimensions` instead (mutually exclusive with `scale`).

### Video export limitations

- **RGB 8-bit required** — raw single-band images cannot export as video; the script uses `.visualize({ forceRgbOutput: true })`.
- **`maxFrames` caps length** — default limit is 1000; the script sets 300. Raise for longer ranges or split into multiple exports.
- **FIRMS = 1 km grid** — timelapse shows daily snapshots, not continuous flames.
- **Export is async** — video tasks can take minutes; use `getVideoThumbURL` for a quick preview first.

Official reference: [Exporting Video and Animations](https://developers.google.com/earth-engine/guides/exporting_video)

---

## Limitations

- **FIRMS is exploratory**, not science-quality. Confidence values vary by region.
- **VIIRS archive starts 2023** — use FIRMS for longer historical context.
- A "fire pixel" is not one fire — it is one satellite grid cell flagged as burning.
- Cloud cover can hide fires; dry-season haze can also affect detection.

---

## What's next

- [Deforestation](./05-borneo-deforestation.md) — forest loss near the same area
- [Weather](./09-borneo-weather.md) — forecast precipitation and wind (dry/wet season context)
