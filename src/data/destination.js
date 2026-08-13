/**
 * destination.js
 * ----------------------------------------------------------------------
 * Single source of truth for the fixed journey destination.
 * Change coordinates here only — every other module reads from this file.
 *
 * Coordinates verified via Google Places for "Elsewedy Electric East
 * Africa Ltd Factory", Mwasonga Road, Kisarawe II, Kigamboni, Dar es
 * Salaam — the manufacturing plant/industrial complex referred to as
 * "Elsewedy Electric Industries".
 * ----------------------------------------------------------------------
 */

export const ELSEWEDY_ELECTRIC = {
  id: 'elsewedy-electric-industries',
  name: 'Elsewedy Electric Industries',
  subtitle: 'Elsewedy Electric East Africa Factory',
  address: 'Mwasonga Road, Kisarawe II, Kigamboni, Dar es Salaam, Tanzania',
  latitude: -6.9266375,
  longitude: 39.3833906,

  // Radius (meters) within which the user is considered "arrived".
  arrivalRadiusMeters: 120,

  // Radius (meters) at which the UI switches into "approaching" mode
  // (bigger warning, slower-paced UI, prepare-to-arrive messaging).
  approachRadiusMeters: 500
};

export default ELSEWEDY_ELECTRIC;
