'use client';

import { useState } from "react";
import NewsletterList from "./NewsletterList";
import NewsletterView from "./NewsletterView";
import SiteHeader from "../SiteHeader";

export default function NewsletterPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

      <SiteHeader activePage="newsletter" />

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

        {/* Right column: reader */}
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
                Select a briefing on the left to read.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
