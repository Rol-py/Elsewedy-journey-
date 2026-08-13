/**
 * eta.js
 * ----------------------------------------------------------------------
 * Dedicated ETA calculation module. Kept isolated so the "what speed do
 * we trust" logic lives in exactly one place.
 * ----------------------------------------------------------------------
 */

// Fallback average speed assumptions (m/s) used when GPS speed is
// unavailable or unreliable.
export const FALLBACK_WALKING_SPEED_MPS = 1.3; // ~4.7 km/h
export const FALLBACK_DRIVING_SPEED_MPS = 8.3; // ~30 km/h (city traffic)

// Additional preset speeds for explicit estimates in the UI.
export const SLOW_DRIVING_SPEED_MPS = 5.0; // ~18 km/h (very slow)
export const AVG_DRIVING_SPEED_MPS = 13.9; // ~50 km/h (average open-road)

// GPS-reported speed below this is treated as "stationary/noise" rather
// than a real moving speed, to avoid using tiny jitter values.
const MIN_TRUSTED_SPEED_MPS = 0.5;

// A short rolling window of recent speed samples smooths out GPS jitter
// so ETA doesn't jump wildly between updates.
const SPEED_HISTORY_SIZE = 5;

export function createSpeedTracker() {
  let history = [];
  return {
    /** Feed a new GPS speed sample (m/s or null). Returns the smoothed speed (m/s or null). */
    push(speedMps) {
      if (typeof speedMps === 'number' && speedMps >= MIN_TRUSTED_SPEED_MPS) {
        history.push(speedMps);
        if (history.length > SPEED_HISTORY_SIZE) history.shift();
      }
      if (history.length === 0) return null;
      return history.reduce((sum, v) => sum + v, 0) / history.length;
    },
    reset() {
      history = [];
    }
  };
}

/**
 * Estimate travel mode from a smoothed speed sample, so the fallback
 * speed (when GPS speed disappears) roughly matches how the user has
 * been moving.
 */
function guessFallbackSpeed(lastKnownSmoothedSpeedMps) {
  if (lastKnownSmoothedSpeedMps != null && lastKnownSmoothedSpeedMps > 2.5) {
    return FALLBACK_DRIVING_SPEED_MPS;
  }
  return FALLBACK_WALKING_SPEED_MPS;
}

/** Calculate ETA using an explicit fixed speed (m/s). Returns same shape as calculateETA. */
export function calculateETAForSpeed(remainingMeters, speedMps) {
  if (remainingMeters == null || Number.isNaN(remainingMeters) || remainingMeters < 0) {
    return { seconds: null, label: '—', speedUsedMps: 0, isEstimate: true };
  }

  if (remainingMeters < 15) {
    return { seconds: 0, label: 'Arriving', speedUsedMps: speedMps || 0, isEstimate: false };
  }

  const seconds = remainingMeters / speedMps;
  return { seconds, label: formatDuration(seconds), speedUsedMps: speedMps, isEstimate: true };
}

/**
 * Calculate ETA.
 *
 * @param {number} remainingMeters   distance left to travel
 * @param {number|null} smoothedSpeedMps  smoothed GPS speed (from createSpeedTracker)
 * @returns {{ seconds: number|null, label: string, speedUsedMps: number, isEstimate: boolean }}
 */
export function calculateETA(remainingMeters, speedMps) {
  if (remainingMeters == null || Number.isNaN(remainingMeters) || remainingMeters < 0) {
    return { seconds: null, label: '—', speedUsedMps: 0, isEstimate: true };
  }

  if (remainingMeters < 15) {
    return { seconds: 0, label: 'Arriving', speedUsedMps: speedMps || 0, isEstimate: false };
  }

  const hasTrustedSpeed = typeof speedMps === 'number' && speedMps >= MIN_TRUSTED_SPEED_MPS;
  const speedToUse = hasTrustedSpeed ? speedMps : guessFallbackSpeed(speedMps);

  const seconds = remainingMeters / speedToUse;

  return {
    seconds,
    label: formatDuration(seconds),
    speedUsedMps: speedToUse,
    isEstimate: !hasTrustedSpeed
  };
}

export function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  if (seconds < 60) return '< 1 min';
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function formatSpeedKmh(speedMps) {
  if (speedMps == null || Number.isNaN(speedMps)) return '—';
  return `${Math.round(speedMps * 3.6)} km/h`;
}
