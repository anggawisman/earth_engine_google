/**
 * Weather example: GFS 24-hour forecast precipitation over Southeast Asia.
 *
 * Run:
 *   GEE_CLOUD_PROJECT=your-project GEE_SERVICE_ACCOUNT_KEY_PATH=./credentials/key.json node docs/examples/weather-gfs.js
 */
const { ee, initEarthEngine, getInfo, getMapId } = require('./auth-init');

// [west, south, east, north]
const SOUTHEAST_ASIA = ee.Geometry.Rectangle([95, -11, 141, 6]);

const PRECIP_VIS = {
  bands: ['total_precipitation_surface'],
  min: 0,
  max: 50,
  palette: ['white', 'lightblue', 'blue', 'darkblue', 'purple'],
};

async function main() {
  await initEarthEngine();

  const now = Date.now();
  const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

  const gfsImage = ee
    .ImageCollection('NOAA/GFS0P25')
    .filterDate(new Date(twoDaysAgo), new Date(now))
    .filter(ee.Filter.eq('forecast_hours', 24))
    .sort('creation_time', false)
    .first()
    .select('total_precipitation_surface');

  const regionalStats = await getInfo(
    gfsImage.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: SOUTHEAST_ASIA,
      scale: 25000,
      maxPixels: 1e9,
    })
  );

  const mapTile = await getMapId(gfsImage, PRECIP_VIS);

  console.log(
    JSON.stringify(
      {
        region: 'Southeast Asia',
        forecast_hours: 24,
        mean_precipitation_kg_m2:
          Math.round(regionalStats.total_precipitation_surface * 100) / 100,
        mapTile: {
          mapid: mapTile.mapid,
          token: mapTile.token,
          urlFormat: mapTile.urlFormat,
        },
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
