import { useState, useEffect } from "react";
import { fetchNewsletters } from "../../api/newsletter";
import { useLanguage } from "../../contexts/LanguageContext";
import type { NewsletterSummary } from "../../api/newsletter";

interface Props {
  onSelect: (date: string) => void;
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

export default function NewsletterList({ onSelect }: Props) {
  const { t } = useLanguage();
  const [newsletters, setNewsletters] = useState<NewsletterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsletters()
      .then((data) => setNewsletters(data.results))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#44445a",
          fontSize: "0.85rem",
        }}
      >
        {t.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#e05252",
          fontSize: "0.85rem",
        }}
      >
        ⚠ {error}
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#44445a",
          fontSize: "0.85rem",
        }}
      >
        {t.noBriefingsYet}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {newsletters.map((nl) => (
        <button
          key={nl.id}
          onClick={() => onSelect(nl.date)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            borderBottom: "1px solid #1e1e2a",
            padding: "0.9rem 1.1rem",
            cursor: "pointer",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#16161f")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#55556a",
              marginBottom: "0.3rem",
            }}
          >
            {formatDate(nl.date)}
            {nl.event_count > 0 && (
              <span style={{ marginLeft: "0.5rem", color: "#33334a" }}>
                · {t.eventCount(nl.event_count)}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "#d8d8e8",
              lineHeight: 1.4,
            }}
          >
            {nl.subject}
          </div>
        </button>
      ))}
    </div>
  );
}
