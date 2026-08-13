import { formatDistance } from '../services/distance.js';
import { formatSpeedKmh } from '../services/eta.js';

export default function JourneyInfo({ remainingMeters, etaLabel, isEtaEstimate, speedMps, destinationName }) {
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
    </div>
  );
}
