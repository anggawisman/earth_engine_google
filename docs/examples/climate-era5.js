/**
 * Climate example: ERA5-Land monthly temperature at a point.
 *
 * Run:
 *   GEE_CLOUD_PROJECT=your-project GEE_SERVICE_ACCOUNT_KEY_PATH=./credentials/key.json node docs/examples/climate-era5.js
 */
const { ee, initEarthEngine, getInfo } = require('./auth-init');

const JAKARTA = ee.Geometry.Point([106.8, -6.2]);
const DATE_START = '2023-01-01';
const DATE_END = '2023-02-01';

async function main() {
  await initEarthEngine();

  const image = ee
    .ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR')
    .filterDate(DATE_START, DATE_END)
    .first()
    .select('temperature_2m');

  const stats = await getInfo(
    image.reduceRegion({
      reducer: ee.Reducer.first(),
      geometry: JAKARTA,
      scale: 10000,
    })
  );

  const tempK = stats.temperature_2m;
  const tempC = tempK - 273.15;

  console.log(
    JSON.stringify(
      {
        location: 'Jakarta',
        date: '2023-01',
        temperature_k: Math.round(tempK * 100) / 100,
        temperature_c: Math.round(tempC * 100) / 100,
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
