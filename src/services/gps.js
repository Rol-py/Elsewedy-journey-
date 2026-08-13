/**
 * gps.js
 * ----------------------------------------------------------------------
 * Thin wrapper around the browser Geolocation API. Nothing here knows
 * about React, routes, checkpoints, or the UI — it only reports raw
 * position updates and normalized errors through callbacks.
 * ----------------------------------------------------------------------
 */

export const GPS_ERROR_TYPES = {
  UNSUPPORTED: 'UNSUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 2000,
  timeout: 15000
};

const FIRST_FIX_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000
};

function normalizeError(err) {
  if (!err || typeof err.code === 'undefined') {
    return { type: GPS_ERROR_TYPES.UNKNOWN, message: 'An unknown location error occurred.' };
  }
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return {
        type: GPS_ERROR_TYPES.PERMISSION_DENIED,
        message: 'Location permission was denied. Enable location access for this site in your browser settings.'
      };
    case err.POSITION_UNAVAILABLE:
      return {
        type: GPS_ERROR_TYPES.POSITION_UNAVAILABLE,
        message: 'Your position is currently unavailable. Move to an open area and check your GPS/network signal.'
      };
    case err.TIMEOUT:
      return {
        type: GPS_ERROR_TYPES.TIMEOUT,
        message: 'Location request timed out. Retrying…'
      };
    default:
      return { type: GPS_ERROR_TYPES.UNKNOWN, message: err.message || 'An unknown location error occurred.' };
  }
}

function normalizePosition(position) {
  const { coords, timestamp } = position;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy ?? null,
    altitude: coords.altitude ?? null,
    altitudeAccuracy: coords.altitudeAccuracy ?? null,
    heading: Number.isFinite(coords.heading) ? coords.heading : null,
    // speed is in meters/second per the spec, or null if unavailable.
    speed: Number.isFinite(coords.speed) && coords.speed >= 0 ? coords.speed : null,
    timestamp
  };
}

export function isGeolocationSupported() {
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

/**
 * Request a single initial fix. Resolves with a normalized position or
 * rejects with a normalized error — used to drive the permission-request
 * step distinctly from the continuous watch.
 */
export function requestInitialPosition() {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject({ type: GPS_ERROR_TYPES.UNSUPPORTED, message: 'Geolocation is not supported on this device/browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(normalizePosition(position)),
      (err) => reject(normalizeError(err)),
      FIRST_FIX_OPTIONS
    );
  });
}

/**
 * Start continuously watching the user's position.
 * onPosition(normalizedPosition) fires on every update.
 * onError(normalizedError) fires on every error (does not stop the watch —
 * the browser keeps retrying transient errors like TIMEOUT).
 * Returns a stop() function.
 */
export function watchPosition(onPosition, onError) {
  if (!isGeolocationSupported()) {
    onError({ type: GPS_ERROR_TYPES.UNSUPPORTED, message: 'Geolocation is not supported on this device/browser.' });
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => onPosition(normalizePosition(position)),
    (err) => onError(normalizeError(err)),
    WATCH_OPTIONS
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
