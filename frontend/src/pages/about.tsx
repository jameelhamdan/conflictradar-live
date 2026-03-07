const CONTACT_CARDS = [
  {
    icon: "✉",
    label: "General enquiries",
    email: "contact@conflictradar.live",
    note: null,
  },
  {
    icon: "🔎",
    label: "Source & data requests",
    email: "contact@conflictradar.live",
    note: "Want us to track a specific region, outlet, or Telegram channel? Send us the details.",
  },
  {
    icon: "📰",
    label: "Press & media",
    email: "contact@conflictradar.live",
    note: "For media use of our data or map embeds, please reach out before publishing.",
  },
];

const LEGEND = [
  {
    label: "Conflict",
    color: "#e05252",
    desc: "Armed clashes, military operations, airstrikes",
  },
  {
    label: "Protest",
    color: "#e09652",
    desc: "Demonstrations, civil unrest, strikes",
  },
  {
    label: "Disaster",
    color: "#e0c852",
    desc: "Natural disasters, industrial accidents",
  },
  {
    label: "Political",
    color: "#7c9ef8",
    desc: "Elections, diplomacy, government decisions",
  },
  {
    label: "Economic",
    color: "#52c8a0",
    desc: "Sanctions, market events, trade disruptions",
  },
  {
    label: "Crime",
    color: "#c852c8",
    desc: "High-profile crime, organized crime, arrests",
  },
  { label: "General", color: "#888899", desc: "Other noteworthy events" },
];

const NAV_LINK = {
  color: "#55556a",
  fontSize: "0.82rem",
  fontWeight: 500,
  textDecoration: "none",
  padding: "0.25rem 0.5rem",
  borderRadius: 4,
} as const;

export default function AboutPage() {
  return (
    <div
      style={{ minHeight: "100vh", background: "#0f0f13", color: "#e0e0e0" }}
    >
      <title>About — conflictradar.live</title>
      <meta name="description" content="About conflictradar.live — a real-time intelligence platform tracking global conflicts, protests, disasters, and political events using NLP-powered news analysis." />
      <link rel="canonical" href="https://conflictradar.live/about" />
      <meta property="og:title" content="About — conflictradar.live" />
      <meta property="og:description" content="About conflictradar.live — a real-time intelligence platform tracking global conflicts, protests, disasters, and political events using NLP-powered news analysis." />
      <meta property="og:url" content="https://conflictradar.live/about" />
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
          height: 44,
          background: "#13131c",
          borderBottom: "1px solid #222230",
        }}
      >
        <a
          href="/"
          style={{
            color: "#55556a",
            fontSize: "0.82rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          ← Live map
        </a>
        <a href="/about" style={{ ...NAV_LINK, color: "#e8e8f0" }}>
          About
        </a>
      </nav>

      <div
        style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 2rem 5rem" }}
      >
        <header style={{ marginBottom: "3rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#e05252",
              background: "#e0525218",
              border: "1px solid #e0525230",
              borderRadius: 99,
              padding: "0.25rem 0.75rem",
              marginBottom: "1rem",
            }}
          >
            Open-source · Real-time
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: "1rem",
            }}
          >
            <span style={{ color: "#e8e8f0" }}>conflictradar</span>
            <span style={{ color: "#e05252" }}>.live</span>
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#888899",
              lineHeight: 1.6,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            A real-time intelligence platform that turns raw news into a global
            conflict picture.
          </p>
        </header>

        <section
          style={{
            marginBottom: "2.5rem",
            borderTop: "1px solid #1a1a26",
            paddingTop: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#c8c8d8",
              marginBottom: "1rem",
              letterSpacing: "-0.01em",
            }}
          >
            What we do
          </h2>
          <p
            style={{ color: "#888899", lineHeight: 1.75, fontSize: "0.95rem" }}
          >
            conflictradar.live monitors hundreds of news sources — Telegram
            channels, wire feeds, and regional outlets — and uses natural
            language processing to extract, classify, and geolocate events as
            they happen. The result is an interactive live map where you can
            explore ongoing conflicts, protests, disasters, and political
            developments anywhere in the world.
          </p>
        </section>
        <section
          style={{
            marginBottom: "2.5rem",
            borderTop: "1px solid #1a1a26",
            paddingTop: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#c8c8d8",
              marginBottom: "1rem",
              letterSpacing: "-0.01em",
            }}
          >
            Category legend
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            {LEGEND.map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: item.color,
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  {item.label}
                </span>
                <span style={{ color: "#55556a", fontSize: "0.82rem" }}>
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ borderTop: "1px solid #1a1a26", paddingTop: "2rem" }}>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#c8c8d8",
              marginBottom: "1.25rem",
              letterSpacing: "-0.01em",
            }}
          >
            Contact
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginBottom: "1.75rem",
            }}
          >
            {CONTACT_CARDS.map((card) => (
              <div
                key={card.email}
                style={{
                  background: "#13131c",
                  border: "1px solid #1e1e2a",
                  borderRadius: 10,
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    fontSize: "1.4rem",
                    marginBottom: "0.5rem",
                    lineHeight: 1,
                  }}
                >
                  {card.icon}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#55556a",
                    marginBottom: "0.35rem",
                  }}
                >
                  {card.label}
                </div>
                <a
                  href={`mailto:${card.email}`}
                  style={{
                    display: "inline-block",
                    color: "#7c9ef8",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    marginBottom: card.note ? "0.4rem" : 0,
                  }}
                >
                  {card.email}
                </a>
                {card.note && (
                  <p
                    style={{
                      color: "#55556a",
                      fontSize: "0.82rem",
                      lineHeight: 1.6,
                      marginTop: "0.35rem",
                    }}
                  >
                    {card.note}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p
            style={{
              color: "#44445a",
              fontSize: "0.85rem",
              lineHeight: 1.7,
              textAlign: "center",
            }}
          >
            conflictradar.live is a small independent project. We aim to respond
            within 48 hours but cannot guarantee replies to every message. For
            urgent operational matters, include <em>"URGENT"</em> in the subject
            line.
          </p>
        </section>
      </div>

      <footer style={{
        borderTop: '1px solid #1a1a26',
        padding: '1.25rem 2rem',
        display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
        fontSize: '0.78rem', color: '#44445a',
      }}>
        <a href="/terms" style={{ color: '#44445a', textDecoration: 'none' }}>Terms of Service</a>
        <a href="/privacy" style={{ color: '#44445a', textDecoration: 'none' }}>Privacy Policy</a>
      </footer>
    </div>
  );
}

export const getConfig = async () => ({ render: "static" as const });
