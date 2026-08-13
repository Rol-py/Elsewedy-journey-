export default function Splash({ onFinish, duration = 1500 }) {
  // Simple non-interactive splash; tries PNG first, falls back to bundled SVG.
  return (
    <div className="splash-screen" role="img" aria-label="Elsewedy logo splash">
      <img
        src="/elsewedy-logo.png"
        alt="Elsewedy Electric"
        className="splash-screen__logo"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/icon.svg';
        }}
      />
    </div>
  );
}
