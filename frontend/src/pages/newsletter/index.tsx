import React, { useState } from "react";
import NewsletterList from "../../components/NewsletterList";
import NewsletterView from "../../components/NewsletterView";
import { subscribeToNewsletter } from "../../api/newsletter";

export default function NewsletterPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeState, setSubscribeState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [subscribeMsg, setSubscribeMsg] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!subscribeEmail.trim()) return;
    setSubscribeState("loading");
    try {
      const res = await subscribeToNewsletter(subscribeEmail.trim());
      setSubscribeMsg(res.detail);
      setSubscribeState("success");
      setSubscribeEmail("");
    } catch (err) {
      setSubscribeMsg((err as Error).message);
      setSubscribeState("error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f13",
        color: "#e0e0e0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <title>Daily Briefing — conflictradar.live</title>
      <meta
        name="description"
        content="Daily AI-written geopolitical briefing from conflictradar.live, summarising the most important global events."
      />
      <link rel="canonical" href="https://conflictradar.live/newsletter" />

      {/* Top nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
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
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "#e8e8f0",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Daily Briefing
        </span>
      </nav>

      {/* Main layout */}
      <main
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          borderTop: "1px solid #1a1a26",
        }}
      >
        {/* Left column: list */}
        <section
          style={{
            width: 320,
            flexShrink: 0,
            borderRight: "1px solid #1e1e2a",
            background: "#0d0d14",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #1e1e2a",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#888899",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Past briefings
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <NewsletterList onSelect={setSelectedDate} />
          </div>
        </section>

        {/* Right column: reader + subscribe */}
        <section
          style={{
            flex: 1,
            minWidth: 0,
            background: "#0d0d14",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            {selectedDate ? (
              <NewsletterView
                date={selectedDate}
                onBack={() => setSelectedDate(null)}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#33334a",
                  fontSize: "0.9rem",
                }}
              >
                Select a briefing on the left to read, or subscribe below.
              </div>
            )}
          </div>

          {/* Subscribe widget */}
          <div
            style={{
              padding: "0.9rem 1.3rem 1.2rem",
              borderTop: "1px solid #1a1a26",
              background: "#0f0f13",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "#55556a",
                marginBottom: "0.55rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Get the daily briefing by email
            </div>
            {subscribeState === "success" ? (
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#52c8a0" }}>
                {subscribeMsg}
              </p>
            ) : (
              <form
                onSubmit={handleSubscribe}
                style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  required
                  style={{
                    flex: "1 1 220px",
                    background: "#16161f",
                    border: `1px solid ${subscribeState === "error" ? "#e05252" : "#2a2a3a"}`,
                    borderRadius: 4,
                    padding: "0.35rem 0.55rem",
                    fontSize: "0.8rem",
                    color: "#e8e8f0",
                    outline: "none",
                    minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={subscribeState === "loading"}
                  style={{
                    background: "#7c9ef822",
                    border: "1px solid #7c9ef844",
                    borderRadius: 4,
                    color: "#7c9ef8",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    padding: "0.35rem 0.8rem",
                    cursor:
                      subscribeState === "loading" ? "default" : "pointer",
                    whiteSpace: "nowrap",
                    opacity: subscribeState === "loading" ? 0.6 : 1,
                  }}
                >
                  {subscribeState === "loading" ? "…" : "Subscribe"}
                </button>
              </form>
            )}
            {subscribeState === "error" && (
              <p
                style={{
                  margin: "0.35rem 0 0",
                  fontSize: "0.72rem",
                  color: "#e05252",
                }}
              >
                {subscribeMsg}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export const getConfig = async () => ({ render: "static" as const });
