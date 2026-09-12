const pageStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 26,
  background: "#05090d",
  color: "#eef9ff",
  fontFamily: "Inter, system-ui, sans-serif",
} as const;

const cardStyle = {
  width: "min(720px, 100%)",
  border: "1px solid #233f4c",
  borderRadius: 20,
  background: "#071017",
  padding: 30,
} as const;

const eyebrowStyle = {
  fontSize: 9,
  letterSpacing: ".16em",
  color: "#69dff4",
} as const;

const headingStyle = {
  fontSize: "clamp(38px, 6vw, 60px)",
  lineHeight: 0.98,
  margin: "9px 0",
} as const;

const copyStyle = {
  color: "#879ca7",
  lineHeight: 1.6,
} as const;

const actionsStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 18,
} as const;

const linkStyle = {
  border: "1px solid #315a6b",
  borderRadius: 9,
  padding: "10px 12px",
  color: "#dff9ff",
  textDecoration: "none",
  fontSize: 10,
  fontWeight: 800,
} as const;

export default function NotFound() {
  return (
    <main id="iam-main" style={pageStyle}>
      <section style={cardStyle}>
        <small style={eyebrowStyle}>404 • ROUTE NOT FOUND</small>
        <h1 style={headingStyle}>That workspace address does not exist.</h1>
        <p style={copyStyle}>
          No saved work was deleted. Return to the platform, open Activity &amp; Restore, or continue a persistent Magnanimous job from Work Engine.
        </p>
        <div style={actionsStyle}>
          <a style={linkStyle} href="/">Dashboard</a>
          <a style={linkStyle} href="/activity">Activity &amp; Restore</a>
          <a style={linkStyle} href="/work-engine">Work Engine</a>
          <a style={linkStyle} href="/magnanimous">Magnanimous AI</a>
        </div>
      </section>
    </main>
  );
}
