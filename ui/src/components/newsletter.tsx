import { useState, useEffect } from "react";
import { fetchNewsletter, fetchNewsletters } from "../api/newsletter";
import { useLanguage } from "../contexts/LanguageContext";
import type { NewsletterDetail, NewsletterSummary } from "../api/newsletter";
import ReactMarkdown from "react-markdown";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

interface ViewProps {
  date: string;
  /** If provided, skips the internal fetch and uses this data directly. */
  initialData?: NewsletterDetail;
}

export function NewsletterView({ date, initialData }: ViewProps) {
  const { t } = useLanguage();
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(initialData ?? null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return; // skip fetch when data is provided
    setLoading(true);
    setError(null);
    fetchNewsletter(date)
      .then(setNewsletter)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date, initialData]);

  const hasCover = Boolean(newsletter?.cover_image_url);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Hero header ───────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          minHeight: hasCover ? 220 : 110,
          background: hasCover ? "transparent" : "#13131c",
          borderBottom: "1px solid #1e1e2a",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* Cover image */}
        {hasCover && (
          <img
            src={newsletter!.cover_image_url!}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hasCover
              ? "linear-gradient(to bottom, rgba(13,13,20,0.3) 0%, rgba(13,13,20,0.92) 70%, #0d0d14 100%)"
              : "none",
          }}
        />

        {/* Text content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "0 1.25rem 1rem",
          }}
        >
          {/* Date + event count */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.4rem",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#888899" }}>
              {newsletter ? formatDate(newsletter.date) : formatDate(date)}
            </span>
            {newsletter && (
              <span style={{ fontSize: "0.72rem", color: "#44445a" }}>· {t.eventCount(newsletter.event_count)}</span>
            )}
          </div>

          {/* Subject */}
          {newsletter && (
            <h1
              style={{
                margin: 0,
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "#e8e8f0",
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}
            >
              {newsletter.subject}
            </h1>
          )}

          {/* Cover credit */}
          {newsletter?.cover_image_credit && (
            <p
              style={{
                margin: "0.45rem 0 0",
                fontSize: "0.67rem",
                color: "#44445a",
                fontStyle: "italic",
              }}
            >
              {t.imageCredit} {newsletter.cover_image_credit}
            </p>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.25rem" }}>
        {loading && (
          <div
            style={{
              textAlign: "center",
              color: "#44445a",
              fontSize: "0.85rem",
              paddingTop: "2rem",
            }}
          >
            {t.loading}
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
            <div className="article-body">
              <ReactMarkdown>{newsletter.body}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ListProps {
  onSelect: (date: string) => void;
}

export function NewsletterList({ onSelect }: ListProps) {
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
              <span style={{ marginLeft: "0.5rem", color: "#33334a" }}>· {t.eventCount(nl.event_count)}</span>
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
