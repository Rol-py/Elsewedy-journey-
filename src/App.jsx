import { useEffect, useRef, useState, useCallback } from 'react';
import ELSEWEDY_ELECTRIC from './data/destination.js';
import CHECKPOINTS from './data/checkpoints.js';
import { NAV_STATE } from './data/navigationStates.js';
import { requestInitialPosition, watchPosition, isGeolocationSupported } from './services/gps.js';
import { haversineDistanceMeters } from './services/distance.js';
import { createSpeedTracker, calculateETA } from './services/eta.js';
import { resolveRoute, evaluateRouteProgress } from './services/routeTracking.js';
import {
  createCheckpointState,
  updateCheckpointState,
  getActiveCheckpoint,
  getProgressSummary
} from './services/checkpointTracking.js';

import Map from './components/Map.jsx';
import NavigationStatus from './components/NavigationStatus.jsx';
import JourneyInfo from './components/JourneyInfo.jsx';
import CheckpointCard from './components/CheckpointCard.jsx';
import ArrivalScreen from './components/ArrivalScreen.jsx';

const speedTracker = createSpeedTracker();

export default function App() {
  const [navState, setNavState] = useState(NAV_STATE.INITIALIZING);
  const [gpsError, setGpsError] = useState(null);
  const [position, setPosition] = useState(null);
  const [routeSearch, setRouteSearch] = useState({
    from: 'My location',
    to: ELSEWEDY_ELECTRIC.name
  });
  const [routePoints, setRoutePoints] = useState(null);
  const [routeSource, setRouteSource] = useState(null);
  const [remainingMeters, setRemainingMeters] = useState(null);
  const [isDeviated, setIsDeviated] = useState(false);
  const [eta, setEta] = useState({ label: '—', isEstimate: true });
  const [smoothedSpeed, setSmoothedSpeed] = useState(null);
  const [checkpointState, setCheckpointState] = useState(() => createCheckpointState(CHECKPOINTS));
  const [justReachedMessage, setJustReachedMessage] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [arrivalDismissed, setArrivalDismissed] = useState(false);

  const stopWatchRef = useRef(null);
  const routeRequestedRef = useRef(false);

  const handlePosition = useCallback((pos) => {
    setPosition(pos);
    setGpsError(null);
    setRouteSearch((prev) => ({
      ...prev,
      from: `My location (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`
    }));
    speedTracker.push(pos.speed);
  }, []);

  const handleGpsError = useCallback((err) => {
    setGpsError(err.message);
    // A transient timeout shouldn't nuke a journey already in progress —
    // only surface the full error state before we have any fix yet.
    setNavState((prev) => (prev === NAV_STATE.NAVIGATING || prev === NAV_STATE.APPROACHING_DESTINATION ? prev : NAV_STATE.GPS_ERROR));
  }, []);

  // Step 1: request permission + first fix, then start continuous watch.
  useEffect(() => {
    if (!isGeolocationSupported()) {
      setGpsError('Geolocation is not supported on this device/browser.');
      setNavState(NAV_STATE.GPS_ERROR);
      return;
    }

    setNavState(NAV_STATE.LOCATION_REQUESTED);

    requestInitialPosition()
      .then((pos) => {
        handlePosition(pos);
        setNavState(NAV_STATE.LOCATED);
        stopWatchRef.current = watchPosition(handlePosition, handleGpsError);
      })
      .catch((err) => {
        setGpsError(err.message);
        setNavState(NAV_STATE.GPS_ERROR);
      });

    return () => {
      if (stopWatchRef.current) stopWatchRef.current();
    };
  }, [handlePosition, handleGpsError]);

  // Step 2: once we have a first fix, resolve the route (predefined -> auto -> straight line).
  useEffect(() => {
    if (!position || routeRequestedRef.current) return;
    routeRequestedRef.current = true;

    resolveRoute(position, ELSEWEDY_ELECTRIC)
      .then(({ points, source }) => {
        setRoutePoints(points);
        setRouteSource(source);
        setNavState((prev) => (prev === NAV_STATE.GPS_ERROR ? prev : NAV_STATE.NAVIGATING));
      })
      .catch(() => {
        setRoutePoints(null);
        setRouteSource('straight-line');
        setNavState((prev) => (prev === NAV_STATE.GPS_ERROR ? prev : NAV_STATE.NAVIGATING));
      });
  }, [position]);

  // Step 3: on every position update, recompute progress, ETA, checkpoints, arrival.
  useEffect(() => {
    if (!position) return;

    const progress = evaluateRouteProgress(position, routePoints, ELSEWEDY_ELECTRIC);
    setRemainingMeters(progress.remainingMeters);
    setIsDeviated(progress.isDeviated);

    const smoothedSpeed = speedTracker.push(position.speed);
    const liveSpeed = typeof position.speed === 'number' && position.speed >= 0.5 ? position.speed : smoothedSpeed;

    setSmoothedSpeed(smoothedSpeed);
    setEta(calculateETA(progress.remainingMeters, liveSpeed));

    // Checkpoints
    setCheckpointState((prev) => {
      const next = updateCheckpointState(prev, position);
      if (next.justReached) {
        setJustReachedMessage(next.justReached.message);
        setNavState(NAV_STATE.CHECKPOINT_REACHED);
        window.setTimeout(() => {
          setJustReachedMessage(null);
        }, 4000);
      }
      return next;
    });

    // Arrival detection (straight-line distance to the destination point itself).
    const straightLineToDestination = haversineDistanceMeters(
      position.latitude,
      position.longitude,
      ELSEWEDY_ELECTRIC.latitude,
      ELSEWEDY_ELECTRIC.longitude
    );

    if (straightLineToDestination <= ELSEWEDY_ELECTRIC.arrivalRadiusMeters) {
      setArrived(true);
      setNavState(NAV_STATE.ARRIVED);
      if (stopWatchRef.current) {
        stopWatchRef.current();
        stopWatchRef.current = null;
      }
    } else if (straightLineToDestination <= ELSEWEDY_ELECTRIC.approachRadiusMeters) {
      setNavState((prev) => (prev === NAV_STATE.CHECKPOINT_REACHED ? prev : NAV_STATE.APPROACHING_DESTINATION));
    } else {
      setNavState((prev) =>
        prev === NAV_STATE.CHECKPOINT_REACHED || prev === NAV_STATE.APPROACHING_DESTINATION || prev === NAV_STATE.ARRIVED
          ? NAV_STATE.NAVIGATING
          : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, routePoints]);

  const activeCheckpoint = getActiveCheckpoint(checkpointState);
  const checkpointProgress = getProgressSummary(checkpointState);
  const checkpointMarkers = checkpointState.checkpoints.map((cp, idx) => ({
    ...cp,
    completed: idx < checkpointState.completedIds.length
  }));

  const showArrivalScreen = arrived && !arrivalDismissed;

  return (
    <div className="app-shell">
      {showArrivalScreen && (
        <ArrivalScreen destination={ELSEWEDY_ELECTRIC} onDismiss={() => setArrivalDismissed(true)} />
      )}

      <header className="app-header">
        <span className="app-header__brand">⚡ Elsewedy Journey</span>
      </header>

      <div className="route-search" aria-label="Route search">
        <div className="route-search__field">
          <label htmlFor="route-from">From</label>
          <input
            id="route-from"
            type="text"
            value={routeSearch.from}
            onChange={(event) => setRouteSearch((prev) => ({ ...prev, from: event.target.value }))}
            aria-label="Starting location"
          />
        </div>

        <div className="route-search__swap" aria-hidden="true">⇄</div>

        <div className="route-search__field">
          <label htmlFor="route-to">To</label>
          <input
            id="route-to"
            type="text"
            value={routeSearch.to}
            onChange={(event) => setRouteSearch((prev) => ({ ...prev, to: event.target.value }))}
            aria-label="Destination"
          />
        </div>
      </div>

      <div className="app-map-wrap">
        {position || navState === NAV_STATE.GPS_ERROR ? (
          <Map
            userPosition={position}
            destination={ELSEWEDY_ELECTRIC}
            routePoints={routePoints}
            checkpoints={checkpointMarkers}
          />
        ) : (
          <div className="map-placeholder">
            <div className="map-placeholder__spinner" aria-hidden="true" />
            <p>Waiting for GPS location…</p>
          </div>
        )}
      </div>

      <div className="app-panel">
        <NavigationStatus
          state={navState}
          errorMessage={gpsError}
          isDeviated={isDeviated}
          accuracy={position?.accuracy}
        />

        <CheckpointCard
          activeCheckpoint={activeCheckpoint}
          progress={checkpointProgress}
          justReachedMessage={justReachedMessage}
        />

        <JourneyInfo
          remainingMeters={remainingMeters}
          etaLabel={eta.label}
          isEtaEstimate={eta.isEstimate}
          speedMps={smoothedSpeed}
          destinationName={ELSEWEDY_ELECTRIC.name}
        />
      </div>
    </div>
  );
}
