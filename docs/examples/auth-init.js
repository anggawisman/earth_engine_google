/**
 * Reusable Earth Engine authentication and helper utilities for Node.js.
 *
 * Environment variables:
 *   GEE_CLOUD_PROJECT              - Your Google Cloud project ID
 *   GEE_SERVICE_ACCOUNT_KEY_PATH   - Path to service account JSON key file
 *
 * Usage:
 *   const { ee, initEarthEngine, getInfo } = require('./auth-init');
 *   await initEarthEngine();
 */
const ee = require('@google/earthengine');
const path = require('path');

function loadPrivateKey() {
  const keyPath = process.env.GEE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) {
    throw new Error('GEE_SERVICE_ACCOUNT_KEY_PATH is not set');
  }
  return require(path.resolve(keyPath));
}

function initEarthEngine(projectId) {
  const project = projectId || process.env.GEE_CLOUD_PROJECT;
  if (!project) {
    throw new Error('GEE_CLOUD_PROJECT is not set');
  }

  return new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      loadPrivateKey(),
      () => {
        ee.initialize(null, null, resolve, reject, null, project);
      },
      reject
    );
  });
}

function getInfo(eeObject) {
  return new Promise((resolve, reject) => {
    eeObject.getInfo((result, error) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

function getMapId(image, visParams) {
  return new Promise((resolve, reject) => {
    image.getMapId(visParams, (map, error) => {
      if (error) reject(error);
      else resolve(map);
    });
  });
}

module.exports = { ee, initEarthEngine, getInfo, getMapId };
