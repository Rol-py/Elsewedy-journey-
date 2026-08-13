export default function Splash({ onFinish, duration = 1500 }) {
  // Simple non-interactive splash; parent controls visibility.
  // Image referenced at /elsewedy-logo.png — add your logo to public/elsewedy-logo.png
  return (
    <div className="splash-screen" role="img" aria-label="Elsewedy logo splash">
      <img src="/elsewedy-logo.png" alt="Elsewedy Electric" className="splash-screen__logo" />
    </div>
  );
}
