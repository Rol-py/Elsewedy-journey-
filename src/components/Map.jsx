import { Fragment, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default Leaflet marker icons reference bundled image files that Vite
// doesn't resolve automatically — build them from CDN URLs instead so
// markers render correctly without extra asset config.
const userIcon = L.divIcon({
  className: 'user-marker',
  html: '<div class="user-marker__dot"><div class="user-marker__pulse"></div></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  html: '<div class="destination-marker__pin"><span class="destination-marker__glyph">⚡</span></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 34]
});

const checkpointIcon = (completed) =>
  L.divIcon({
    className: 'checkpoint-marker',
    html: `<div class="checkpoint-marker__dot ${completed ? 'checkpoint-marker__dot--done' : ''}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

/** Recenter/refit the map whenever key inputs change, without fighting user pan/zoom every render. */
function MapAutoFit({ userPosition, destination, routePoints, followUser }) {
  const map = useMap();
  const hasFitBounds = useRef(false);

  useEffect(() => {
    if (!userPosition) return;

    if (followUser) {
      map.setView([userPosition.latitude, userPosition.longitude], map.getZoom() < 14 ? 16 : map.getZoom(), {
        animate: true
      });
      return;
    }

    if (!hasFitBounds.current) {
      const bounds = L.latLngBounds([
        [userPosition.latitude, userPosition.longitude],
        [destination.latitude, destination.longitude]
      ]);
      if (routePoints && routePoints.length > 1) {
        routePoints.forEach((p) => bounds.extend([p.latitude, p.longitude]));
      }
      map.fitBounds(bounds, { padding: [40, 40] });
      hasFitBounds.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition?.latitude, userPosition?.longitude, followUser]);

  return null;
}

export default function Map({ userPosition, destination, routePoints, checkpoints, followUser = true }) {
  const center = userPosition
    ? [userPosition.latitude, userPosition.longitude]
    : [destination.latitude, destination.longitude];

  return (
    <MapContainer
      center={center}
      zoom={14}
      zoomControl={false}
      attributionControl={true}
      className="app-map"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        maxZoom={19}
      />

      {routePoints && routePoints.length > 1 && (
        <Polyline
          positions={routePoints.map((p) => [p.latitude, p.longitude])}
          pathOptions={{ color: '#f5b400', weight: 5, opacity: 0.85 }}
        />
      )}

      {checkpoints?.map((cp) => (
        <Fragment key={cp.id}>
          <Marker position={[cp.latitude, cp.longitude]} icon={checkpointIcon(cp.completed)} />
          <Circle
            center={[cp.latitude, cp.longitude]}
            radius={cp.radius}
            pathOptions={{ color: cp.completed ? '#3ecf6e' : '#f5b400', fillOpacity: 0.08, weight: 1 }}
          />
        </Fragment>
      ))}

      <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon} />
      <Circle
        center={[destination.latitude, destination.longitude]}
        radius={destination.arrivalRadiusMeters}
        pathOptions={{ color: '#f5b400', fillOpacity: 0.06, weight: 1, dashArray: '4 6' }}
      />

      {userPosition && (
        <>
          <Marker position={[userPosition.latitude, userPosition.longitude]} icon={userIcon} />
          {userPosition.accuracy && (
            <Circle
              center={[userPosition.latitude, userPosition.longitude]}
              radius={userPosition.accuracy}
              pathOptions={{ color: '#3aa0ff', fillOpacity: 0.08, weight: 1 }}
            />
          )}
        </>
      )}

      <MapAutoFit
        userPosition={userPosition}
        destination={destination}
        routePoints={routePoints}
        followUser={followUser}
      />
    </MapContainer>
  );
}
