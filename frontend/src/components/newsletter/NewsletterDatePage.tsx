"use client";

import { useState, useEffect } from "react";
import SiteHeader from "../SiteHeader";
import NewsletterView from "./NewsletterView";
import { fetchLatestNewsletter } from "../../api/newsletter";
import type { NewsletterDetail } from "../../api/newsletter";

export default function NewsletterDatePage() {
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract yyyy/mm/dd from the URL path
    const parts = window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    // Expected: ["newsletter", "yyyy", "mm", "dd"]
    const [, year, month, day] = parts;
    const date = year && month && day ? `${year}-${month}-${day}` : null;

    if (!date) {
      setError("Invalid date in URL.");
      setLoading(false);
      return;
    }

    // Try the exact date; fall back to latest published
    fetch(`/api/newsletter/${date}/`)
      .then(async (res) => {
        if (res.ok) return res.json() as Promise<NewsletterDetail>;
        // Fallback: fetch latest
        return fetchLatestNewsletter();
      })
      .then(setNewsletter)
      .catch(() => setError("Could not load newsletter."))
      .finally(() => setLoading(false));
  }, []);

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
      <SiteHeader activePage="newsletter" />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {loading && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#44445a",
              fontSize: "0.85rem",
            }}
          >
            Loading…
          </div>
        )}
        {error && !loading && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#e05252",
              fontSize: "0.85rem",
            }}
          >
            ⚠ {error}
          </div>
        )}
        {newsletter && !loading && (
          <div style={{ flex: 1, maxWidth: 760, width: "100%", margin: "0 auto" }}>
            {/* Pass initialData so NewsletterView skips a redundant second fetch */}
            <NewsletterView
              date={newsletter.date}
              initialData={newsletter}
              onBack={() => { window.location.href = "/newsletter"; }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
