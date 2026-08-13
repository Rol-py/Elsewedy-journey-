/**
 * distance.js
 * ----------------------------------------------------------------------
 * Geographical distance calculations. Everything here is pure math —
 * no GPS, no React, no UI.
 * ----------------------------------------------------------------------
 */

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two lat/lng points, in meters.
 * Haversine formula — accurate for the short-to-medium distances
 * relevant to street-level navigation (Euclidean lat/lng distance is
 * not used because degrees of longitude shrink with latitude).
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Total length of a polyline (array of {latitude, longitude} or
 * [lat, lng] points), in meters.
 */
export function polylineLengthMeters(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [lat1, lon1] = toLatLng(points[i - 1]);
    const [lat2, lon2] = toLatLng(points[i]);
    total += haversineDistanceMeters(lat1, lon1, lat2, lon2);
  }
  return total;
}

function toLatLng(point) {
  if (Array.isArray(point)) return [point[0], point[1]];
  return [point.latitude, point.longitude];
}

/**
 * Finds the closest point on a polyline to the given position, and
 * returns:
 *  - segmentIndex: index of the polyline vertex that starts the closest segment
 *  - distanceToRouteMeters: perpendicular-ish distance from the user to the route
 *  - remainingRouteMeters: distance from the closest point onward to the end of the route
 *
 * Uses an equirectangular local projection (accurate at city scale) to
 * do cheap 2D point-to-segment projection, then measures real distances
 * with Haversine so results stay geographically correct.
 */
export function projectOntoRoute(position, points) {
  if (!Array.isArray(points) || points.length < 2 || !position) {
    return { segmentIndex: 0, distanceToRouteMeters: null, remainingRouteMeters: 0, closestPoint: null };
  }

  const { latitude: lat, longitude: lon } = position;
  const latRad = toRadians(lat);
  const cosLat = Math.cos(latRad);

  // Local flat-earth projection helper (meters), centered near the user.
  const project = (plat, plon) => ({
    x: toRadians(plon - lon) * cosLat * EARTH_RADIUS_METERS,
    y: toRadians(plat - lat) * EARTH_RADIUS_METERS
  });

  const p = project(lat, lon); // = {0,0} by construction

  let best = { distSq: Infinity, segmentIndex: 0, t: 0 };

  for (let i = 0; i < points.length - 1; i++) {
    const [lat1, lon1] = toLatLng(points[i]);
    const [lat2, lon2] = toLatLng(points[i + 1]);
    const a = project(lat1, lon1);
    const b = project(lat2, lon2);

    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lenSq = abx * abx + aby * aby;

    let t = 0;
    if (lenSq > 0) {
      t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const cx = a.x + t * abx;
    const cy = a.y + t * aby;
    const distSq = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy);

    if (distSq < best.distSq) {
      best = { distSq, segmentIndex: i, t };
    }
  }

  const [lat1, lon1] = toLatLng(points[best.segmentIndex]);
  const [lat2, lon2] = toLatLng(points[best.segmentIndex + 1]);
  const closestLat = lat1 + (lat2 - lat1) * best.t;
  const closestLon = lon1 + (lon2 - lon1) * best.t;

  const distanceToRouteMeters = haversineDistanceMeters(lat, lon, closestLat, closestLon);

  // Remaining distance = partial length of the closest segment + all
  // full segments after it.
  const segmentRemaining = haversineDistanceMeters(closestLat, closestLon, lat2, lon2);
  let remainingRouteMeters = segmentRemaining;
  for (let i = best.segmentIndex + 1; i < points.length - 1; i++) {
    const [a1, o1] = toLatLng(points[i]);
    const [a2, o2] = toLatLng(points[i + 1]);
    remainingRouteMeters += haversineDistanceMeters(a1, o1, a2, o2);
  }

  return {
    segmentIndex: best.segmentIndex,
    distanceToRouteMeters,
    remainingRouteMeters,
    closestPoint: { latitude: closestLat, longitude: closestLon }
  };
}

export function metersToKm(meters) {
  return meters / 1000;
}

export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
