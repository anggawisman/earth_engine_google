/**
 * Geophysical example: elevation and land cover at a point.
 *
 * Run:
 *   GEE_CLOUD_PROJECT=your-project GEE_SERVICE_ACCOUNT_KEY_PATH=./credentials/key.json node docs/examples/geophysical-nasadem.js
 */
const { ee, initEarthEngine, getInfo } = require('./auth-init');

const JAKARTA = ee.Geometry.Point([106.8, -6.2]);

const LAND_COVER_LABELS = {
  10: 'Tree cover',
  20: 'Shrubland',
  30: 'Grassland',
  40: 'Cropland',
  50: 'Built-up',
  60: 'Bare / sparse vegetation',
  70: 'Snow and ice',
  80: 'Permanent water bodies',
  90: 'Herbaceous wetland',
  95: 'Mangroves',
  100: 'Moss and lichen',
};

async function main() {
  await initEarthEngine();

  const elevationImage = ee.Image('NASA/NASADEM_HGT/001').select('elevation');
  const landCoverImage = ee
    .ImageCollection('ESA/WorldCover/v200')
    .first()
    .select('Map');

  const [elevStats, lcStats] = await Promise.all([
    getInfo(
      elevationImage.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: JAKARTA,
        scale: 30,
      })
    ),
    getInfo(
      landCoverImage.reduceRegion({
        reducer: ee.Reducer.first(),
        geometry: JAKARTA,
        scale: 10,
      })
    ),
  ]);

  const classId = lcStats.Map;

  console.log(
    JSON.stringify(
      {
        location: 'Jakarta',
        elevation_m: Math.round(elevStats.elevation),
        land_cover_class_id: classId,
        land_cover_label: LAND_COVER_LABELS[classId] || 'Unknown',
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
