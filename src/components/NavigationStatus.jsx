import { NAV_STATE, NAV_STATE_LABEL } from '../data/navigationStates.js';

const STATE_TONE = {
  [NAV_STATE.INITIALIZING]: 'neutral',
  [NAV_STATE.LOCATION_REQUESTED]: 'neutral',
  [NAV_STATE.LOCATED]: 'neutral',
  [NAV_STATE.NAVIGATING]: 'active',
  [NAV_STATE.CHECKPOINT_REACHED]: 'success',
  [NAV_STATE.APPROACHING_DESTINATION]: 'warning',
  [NAV_STATE.ARRIVED]: 'success',
  [NAV_STATE.GPS_ERROR]: 'error'
};

export default function NavigationStatus({ state, errorMessage, isDeviated, accuracy }) {
  const tone = STATE_TONE[state] || 'neutral';
  const label = NAV_STATE_LABEL[state] || state;

  return (
    <div className={`status-bar status-bar--${tone}`}>
      <div className="status-bar__row">
        <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />
        <span className="status-bar__label">{label}</span>
        {accuracy != null && (
          <span className="status-bar__accuracy">±{Math.round(accuracy)}m</span>
        )}
      </div>

      {state === NAV_STATE.GPS_ERROR && errorMessage && (
        <p className="status-bar__message">{errorMessage}</p>
      )}

      {isDeviated && state !== NAV_STATE.GPS_ERROR && state !== NAV_STATE.ARRIVED && (
        <p className="status-bar__warning">⚠️ You are away from the planned route.</p>
      )}
    </div>
  );
}
