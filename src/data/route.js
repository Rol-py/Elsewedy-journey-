/**
 * route.js
 * ----------------------------------------------------------------------
 * Loads the predefined, hand-traced route (public/route.json) when one
 * exists. This is the file the "future predefined route" workflow
 * replaces: trace the real journey in a mapping tool, export ordered
 * lat/lng coordinates, save as public/route.json, and the app will use
 * it automatically instead of the auto-generated OSRM route.
 *
 * Expected route.json shape:
 * {
 *   "points": [
 *     { "latitude": -6.8000, "longitude": 39.2800 },
 *     { "latitude": -6.8100, "longitude": 39.2950 }
 *   ]
 * }
 *
 * Also accepts a bare array of [lat, lng] pairs for convenience.
 *
 * Deviation tolerance (meters) can also be tuned here.
 * ----------------------------------------------------------------------
 */

export const ROUTE_DEVIATION_TOLERANCE_METERS = 80;

/**
 * Attempts to fetch and parse public/route.json.
 * Returns an array of {latitude, longitude} points, or null if no
 * predefined route file exists yet (expected during the prototype
 * phase — the caller should fall back to auto-generated routing).
 */
export async function loadPredefinedRoute() {
  try {
    const response = await fetch('/route.json', { cache: 'no-store' });
    if (!response.ok) return null;

    const data = await response.json();
    const rawPoints = Array.isArray(data) ? data : data.points;
    if (!Array.isArray(rawPoints) || rawPoints.length < 2) return null;

    return rawPoints.map((p) =>
      Array.isArray(p) ? { latitude: p[0], longitude: p[1] } : { latitude: p.latitude, longitude: p.longitude }
    );
  } catch {
    // No file, invalid JSON, or network hiccup — treated as "not provided yet".
    return null;
  }
}

export default loadPredefinedRoute;
