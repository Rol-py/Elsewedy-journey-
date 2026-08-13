/**
 * checkpointTracking.js
 * ----------------------------------------------------------------------
 * Pure checkpoint logic — deliberately has no knowledge of the UI. It
 * takes the static checkpoint list + the user's position and returns
 * which checkpoints are completed, which is active/next, and whether a
 * new one was just reached.
 * ----------------------------------------------------------------------
 */

import { haversineDistanceMeters } from './distance.js';

/**
 * Build the initial tracking state from the static checkpoint list.
 * Checkpoints are processed in ascending `order`.
 */
export function createCheckpointState(checkpoints) {
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order);
  return {
    checkpoints: sorted,
    completedIds: [],
    activeIndex: sorted.length > 0 ? 0 : -1,
    justReached: null // set for one update cycle when a checkpoint is newly reached
  };
}

/**
 * Given the current state and a new GPS position, returns the updated
 * state. Only the currently-active checkpoint is checked (checkpoints
 * are meant to be reached in order), so a completed one is never
 * re-triggered and out-of-order proximity doesn't skip the sequence.
 */
export function updateCheckpointState(state, position) {
  if (!state || state.activeIndex === -1 || state.activeIndex >= state.checkpoints.length) {
    return { ...state, justReached: null };
  }
  if (!position) return { ...state, justReached: null };

  const active = state.checkpoints[state.activeIndex];
  const distance = haversineDistanceMeters(
    position.latitude,
    position.longitude,
    active.latitude,
    active.longitude
  );

  if (distance <= active.radius) {
    return {
      ...state,
      completedIds: [...state.completedIds, active.id],
      activeIndex: state.activeIndex + 1,
      justReached: active
    };
  }

  return { ...state, justReached: null };
}

export function getActiveCheckpoint(state) {
  if (!state || state.activeIndex === -1 || state.activeIndex >= state.checkpoints.length) return null;
  return state.checkpoints[state.activeIndex];
}

export function getProgressSummary(state) {
  if (!state) return { completed: 0, total: 0 };
  return { completed: state.completedIds.length, total: state.checkpoints.length };
}
