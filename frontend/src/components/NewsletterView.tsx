import { useState, useEffect } from "react";
import { fetchNewsletter } from "../api/newsletter";
import type { NewsletterDetail } from "../api/newsletter";

interface Props {
  date: string;
  onBack: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function NewsletterView({ date, onBack }: Props) {
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchNewsletter(date)
      .then(setNewsletter)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.6rem 1rem",
          borderBottom: "1px solid #1e1e2a",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "1px solid #2a2a3a",
            color: "#888899",
            padding: "0.2rem 0.6rem",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: "0.78rem", color: "#55556a" }}>
          {newsletter ? formatDate(newsletter.date) : formatDate(date)}
        </span>
        {newsletter && (
          <span style={{ fontSize: "0.72rem", color: "#33334a" }}>
            · {newsletter.event_count} event
            {newsletter.event_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1rem" }}>
        {loading && (
          <div
            style={{
              textAlign: "center",
              color: "#44445a",
              fontSize: "0.85rem",
              paddingTop: "2rem",
            }}
          >
            Loading…
          </div>
        )}
        {error && (
          <div
            style={{
              textAlign: "center",
              color: "#e05252",
              fontSize: "0.85rem",
              paddingTop: "2rem",
            }}
          >
            ⚠ {error}
          </div>
        )}
        {newsletter && !loading && (
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#e8e8f0",
                marginBottom: "1.5rem",
                lineHeight: 1.35,
              }}
            >
              {newsletter.subject}
            </h2>
            {/* Render the plain text body for the dark-theme web view */}
            <div
              style={{
                fontSize: "0.88rem",
                color: "#c0c0d0",
                lineHeight: 1.75,
              }}
            >
              {newsletter.text_body
                .split("\n\n")
                .filter(
                  (p) =>
                    p.trim() &&
                    !p.startsWith("---") &&
                    !p.includes("Unsubscribe:") &&
                    !p.startsWith("conflictradar"),
                )
                .map((para, i) => (
                  <p key={i} style={{ margin: "0 0 1.1em 0" }}>
                    {para.trim()}
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
