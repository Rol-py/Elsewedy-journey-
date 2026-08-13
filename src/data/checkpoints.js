/**
 * checkpoints.js
 * ----------------------------------------------------------------------
 * Static checkpoint list for the journey. Empty for the first prototype —
 * the checkpoint architecture (tracking, activation, completion) is fully
 * built in services/checkpointTracking.js and works with zero, one, or
 * many entries here.
 *
 * Shape of each checkpoint:
 * {
 *   id: string            - stable unique id
 *   name: string          - display name
 *   latitude: number
 *   longitude: number
 *   radius: number        - detection radius in meters
 *   message: string       - shown when the checkpoint is reached
 *   order: number         - 1-based position in the journey sequence
 * }
 *
 * To add real checkpoints later, just push objects into this array in
 * the order the user should reach them. Nothing else needs to change.
 * ----------------------------------------------------------------------
 */

export const CHECKPOINTS = [
  // Example (commented out) — copy this shape when real checkpoints
  // are traced from the predefined route:
  //
  // {
  //   id: 'checkpoint-1',
  //   name: 'Kigamboni Ferry Terminal',
  //   latitude: -6.8283,
  //   longitude: 39.2925,
  //   radius: 100,
  //   message: '📍 You have reached Kigamboni Ferry Terminal.',
  //   order: 1
  // },
];

export default CHECKPOINTS;
