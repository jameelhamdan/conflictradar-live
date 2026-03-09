import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { fetchNewsletter } from "../../api/newsletter";
import { useLanguage } from "../../contexts/LanguageContext";
import type { NewsletterDetail } from "../../api/newsletter";

interface Props {
  date: string;
  /** If provided, skips the internal fetch and uses this data directly. */
  initialData?: NewsletterDetail;
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

export default function NewsletterView({ date, initialData }: Props) {
  const { t } = useLanguage();
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(
    initialData ?? null,
  );
  const [loading, setLoading] = useState(!initialData);
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
              <span style={{ fontSize: "0.72rem", color: "#44445a" }}>
                · {t.eventCount(newsletter.event_count)}
              </span>
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
            <div className="newsletter-body">
              <ReactMarkdown>{newsletter.body}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
