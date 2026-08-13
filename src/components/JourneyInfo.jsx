import { formatDistance } from '../services/distance.js';
import {
  formatSpeedKmh,
  FALLBACK_WALKING_SPEED_MPS,
  SLOW_DRIVING_SPEED_MPS,
  AVG_DRIVING_SPEED_MPS,
  calculateETAForSpeed
} from '../services/eta.js';

export default function JourneyInfo({ remainingMeters, etaLabel, isEtaEstimate, speedMps, destinationName }) {
  const walkingEta = calculateETAForSpeed(remainingMeters, FALLBACK_WALKING_SPEED_MPS);
  const drivingSlowEta = calculateETAForSpeed(remainingMeters, SLOW_DRIVING_SPEED_MPS);
  const drivingAvgEta = calculateETAForSpeed(remainingMeters, AVG_DRIVING_SPEED_MPS);
  return (
    <div className="journey-info">
      <div className="journey-info__destination">
        <span className="journey-info__destination-label">Destination</span>
        <span className="journey-info__destination-name">{destinationName}</span>
      </div>

      <div className="journey-info__grid">
        <div className="journey-stat">
          <span className="journey-stat__value">{formatDistance(remainingMeters)}</span>
          <span className="journey-stat__label">Distance left</span>
        </div>

        <div className="journey-stat">
          <span className="journey-stat__value">
            {etaLabel}
            {isEtaEstimate && etaLabel !== '—' && <span className="journey-stat__badge">est.</span>}
          </span>
          <span className="journey-stat__label">ETA</span>
        </div>

        <div className="journey-stat">
          <span className="journey-stat__value">{formatSpeedKmh(speedMps)}</span>
          <span className="journey-stat__label">Speed</span>
        </div>
      </div>

      <div className="journey-info__extra">
        <div className="journey-info__extra-row">
          <strong>By foot:</strong> {walkingEta.label} ({formatSpeedKmh(FALLBACK_WALKING_SPEED_MPS)})
        </div>
        <div className="journey-info__extra-row">
          <strong>By car (slow):</strong> {drivingSlowEta.label} ({formatSpeedKmh(SLOW_DRIVING_SPEED_MPS)})
        </div>
        <div className="journey-info__extra-row">
          <strong>By car (avg):</strong> {drivingAvgEta.label} ({formatSpeedKmh(AVG_DRIVING_SPEED_MPS)})
        </div>
      </div>
    </div>
  );
}
