export function GlowingLogo() {
  return (
    <div className="portal-logo animate-fade-in-up">
      <div className="portal-logo-ring"></div>
      <div className="portal-logo-ring"></div>
      <div className="portal-logo-core">
        <span
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#ffffff",
            textShadow: "0 0 10px rgba(255,255,255,0.8)",
          }}
        >
          ADetr
        </span>
      </div>
    </div>
  );
}
