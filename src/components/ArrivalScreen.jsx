export default function ArrivalScreen({ destination, onDismiss }) {
  return (
    <div className="arrival-screen" role="dialog" aria-modal="true" aria-label="Arrival confirmation">
      <div className="arrival-screen__content">
        <div className="arrival-screen__icon" aria-hidden="true">🎉</div>
        <h1 className="arrival-screen__title">YOU HAVE ARRIVED</h1>
        <p className="arrival-screen__subtitle">Welcome to {destination.name}.</p>
        <p className="arrival-screen__address">{destination.address}</p>

        <button type="button" className="arrival-screen__button" onClick={onDismiss}>
          View map
        </button>
      </div>
    </div>
  );
}
