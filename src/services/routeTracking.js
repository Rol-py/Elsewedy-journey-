/**
 * routeTracking.js
 * ----------------------------------------------------------------------
 * Owns "what is the route and how far off it is the user" — decoupled
 * from GPS tracking and from the UI.
 *
 * Route source priority:
 *   1. Predefined route (data/route.js -> public/route.json), once the
 *      user has traced and provided one.
 *   2. Auto-generated route from the public OSRM routing service, used
 *      only to unblock the first prototype. This dependency is isolated
 *      here — swapping it out later does not touch GPS, distance,
 *      checkpoint, ETA, or UI code.
 *   3. Straight line fallback if routing is unreachable (e.g. offline),
 *      so the app never fully breaks.
 * ----------------------------------------------------------------------
 */

import { loadPredefinedRoute, ROUTE_DEVIATION_TOLERANCE_METERS } from '../data/route.js';
import { projectOntoRoute, polylineLengthMeters, haversineDistanceMeters } from './distance.js';

const OSRM_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving';

async function fetchOsrmRoute(start, end) {
  const url = `${OSRM_ENDPOINT}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OSRM request failed: ${response.status}`);
  const data = await response.json();
  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) throw new Error('OSRM returned no route geometry');
  // GeoJSON is [lon, lat] — flip to {latitude, longitude}.
  return coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
}

/**
 * Resolves the route to use for this journey.
 * Returns { points, source } where source is 'predefined' | 'auto' | 'straight-line'.
 */
export async function resolveRoute(start, destination) {
  const predefined = await loadPredefinedRoute();
  if (predefined) {
    return { points: predefined, source: 'predefined' };
  }

  try {
    const points = await fetchOsrmRoute(start, destination);
    return { points, source: 'auto' };
  } catch {
    return {
      points: [
        { latitude: start.latitude, longitude: start.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      ],
      source: 'straight-line'
    };
  }
}

export function getRouteTotalMeters(points) {
  return polylineLengthMeters(points);
}

/**
 * Given the current position and route, returns remaining route
 * distance and whether the user has deviated beyond tolerance.
 * Falls back to straight-line distance to the destination if no route
 * geometry is available at all.
 */
export function evaluateRouteProgress(position, routePoints, destination) {
  if (!position) {
    return { remainingMeters: null, deviationMeters: null, isDeviated: false };
  }

  if (!Array.isArray(routePoints) || routePoints.length < 2) {
    const straight = haversineDistanceMeters(
      position.latitude,
      position.longitude,
      destination.latitude,
      destination.longitude
    );
    return { remainingMeters: straight, deviationMeters: null, isDeviated: false };
  }

  const { distanceToRouteMeters, remainingRouteMeters } = projectOntoRoute(position, routePoints);
  const isDeviated = distanceToRouteMeters != null && distanceToRouteMeters > ROUTE_DEVIATION_TOLERANCE_METERS;

  return {
    remainingMeters: remainingRouteMeters,
    deviationMeters: distanceToRouteMeters,
    isDeviated
  };
}

export { ROUTE_DEVIATION_TOLERANCE_METERS };
