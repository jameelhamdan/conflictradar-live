"use client";

import "../globals.css";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import EventList from "./EventList";
import PriceTicker from "./PriceTicker";
import { fetchEvents } from "../api/events";
import { useSSE } from "../hooks/useSSE";
import { categoryColor, categoryShapeComponent } from "../constants";
import type { EventSummary, EventFilters } from "../types";

const MapView = lazy(() => import("./MapView"));
const POLL_INTERVAL_MS = 60_000;

const CATEGORY_TABS = [
  { value: "", label: "All" },
  { value: "conflict", label: "Conflict" },
  { value: "protest", label: "Protest" },
  { value: "disaster", label: "Disaster" },
  { value: "political", label: "Political" },
  { value: "economic", label: "Economic" },
  { value: "crime", label: "Crime" },
  { value: "general", label: "General" },
] as const;

const QUICK_FILTERS = [
  { value: "6h", label: "6h", ms: 6 * 60 * 60 * 1000 },
  { value: "24h", label: "24h", ms: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { value: "30d", label: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number]["value"] | "";

export default function App() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({ category: "" });
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("");
  const [mounted, setMounted] = useState(false);

  // Stream layers
  const [showNotams, setShowNotams] = useState(true);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showStaticPoints, setShowStaticPoints] = useState(true);
  const [streamRefresh, setStreamRefresh] = useState(0);
  const [latestPriceTick, setLatestPriceTick] = useState<{ symbol: string; value: number; change_pct: number | null; occurred_at: string } | null>(null);

  // SSE: push stream refresh counter and price updates
  useSSE((event) => {
    if (event.type === 'notam_update' || event.type === 'earthquake_update') {
      setStreamRefresh((n) => n + 1);
    }
    if (event.type === 'price_tick') {
      setLatestPriceTick({
        symbol: event.symbol as string,
        value: event.value as number,
        change_pct: event.change_pct as number | null,
        occurred_at: event.occurred_at as string,
      });
    }
  });

  const load = useCallback(async () => {
    try {
      let effectiveFilters = filters;
      if (quickFilter) {
        const offsetMs = QUICK_FILTERS.find((q) => q.value === quickFilter)!.ms;
        effectiveFilters = {
          ...filters,
          start: new Date(Date.now() - offsetMs).toISOString(),
        };
      }
      const data = await fetchEvents(effectiveFilters);
      setEvents(data.results);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters, quickFilter]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  function clearQuickFilter() {
    setQuickFilter("");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "#0f0f13",
        color: "#e0e0e0",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          background: "#13131c",
          borderBottom: "1px solid #1e1e2a",
        }}
      >
        {/* Row 1 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0 1rem",
            height: 44,
            borderBottom: "1px solid #1a1a26",
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                letterSpacing: "-0.01em",
                color: "#e8e8f0",
              }}
            >
              conflictradar
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                letterSpacing: "-0.01em",
                color: "#e05252",
              }}
            >
              .live
            </span>
          </a>

          <nav
            style={{
              display: "flex",
              gap: "0.15rem",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <a
              href="/about"
              style={{
                color: "#55556a",
                fontSize: "0.8rem",
                fontWeight: 500,
                textDecoration: "none",
                padding: "0.2rem 0.45rem",
                borderRadius: 4,
              }}
            >
              About
            </a>
          </nav>

          <div
            style={{
              width: 1,
              height: 18,
              background: "#1e1e2a",
              flexShrink: 0,
            }}
          />

          {/* Time filters */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
              flex: 1,
            }}
          >
            {/* Quick preset buttons */}
            {QUICK_FILTERS.map((qf) => {
              const active = quickFilter === qf.value;
              return (
                <button
                  key={qf.value}
                  onClick={() => {
                    setQuickFilter(active ? "" : qf.value);
                    setFilters((f) => ({ ...f, start: "", end: "" }));
                  }}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: active ? 600 : 400,
                    padding: "0.18rem 0.52rem",
                    borderRadius: 99,
                    border: `1px solid ${active ? "#7c9ef844" : "transparent"}`,
                    background: active ? "#7c9ef81a" : "transparent",
                    color: active ? "#7c9ef8" : "#55556a",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition:
                      "color 0.12s, background 0.12s, border-color 0.12s",
                  }}
                >
                  {qf.label}
                </button>
              );
            })}

            {quickFilter && (
              <button
                onClick={clearQuickFilter}
                title="Clear time filter"
                style={{
                  background: "none",
                  border: "none",
                  color: "#44445a",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  padding: "0.1rem 0.25rem",
                  borderRadius: 3,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.76rem",
              color: "#44445a",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {loading
              ? "Loading…"
              : error
                ? `⚠ ${error}`
                : `${events.length} events`}
          </span>
        </div>

        {/* Row 2 — category tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.2rem",
            padding: "0 0.75rem",
            height: 34,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORY_TABS.map((tab) => {
            const active = filters.category === tab.value;
            const color = tab.value ? categoryColor(tab.value) : "#7c9ef8";
            const Shape = tab.value ? categoryShapeComponent(tab.value) : null;
            return (
              <button
                key={tab.value}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    category:
                      tab.value !== "" && f.category === tab.value
                        ? ""
                        : tab.value,
                  }))
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.28rem",
                  fontSize: "0.77rem",
                  fontWeight: active ? 600 : 400,
                  padding: "0.18rem 0.6rem",
                  borderRadius: 99,
                  border: `1px solid ${active ? color + "55" : color + "22"}`,
                  background: active ? color + "22" : "transparent",
                  color: active ? color : color + "bb",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition:
                    "color 0.12s, background 0.12s, border-color 0.12s",
                  letterSpacing: "0.01em",
                }}
              >
                {Shape
                  ? <Shape size={10} color={active ? color : color + "bb"} />
                  : <span style={{ fontSize: "0.62rem", opacity: active ? 1 : 0.55 }}>◉</span>
                }
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <section style={{ flex: "1 1 60%", minWidth: 0, position: "relative" }}>
          {mounted && (
            <Suspense
              fallback={
                <div style={{ height: "100%", background: "#191920" }} />
              }
            >
              <MapView
                events={events}
                selectedId={selectedId}
                onSelectEvent={setSelectedId}
                streamRefresh={streamRefresh}
                showNotams={showNotams}
                showEarthquakes={showEarthquakes}
                showStaticPoints={showStaticPoints}
              />
            </Suspense>
          )}

          {/* Layer toggles — bottom-left corner over map */}
          <div style={{
            position: "absolute",
            bottom: 28,
            left: 10,
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}>
            {([
              { key: "notams",        label: "NOTAMs",      color: "#ff6644", value: showNotams,        set: setShowNotams },
              { key: "earthquakes",   label: "Earthquakes",  color: "#7c6ef8", value: showEarthquakes,   set: setShowEarthquakes },
              { key: "staticPoints",  label: "Locations",    color: "#4fc3f7", value: showStaticPoints,  set: setShowStaticPoints },
            ] as const).map(({ key, label, color, value, set }) => (
              <button
                key={key}
                onClick={() => set((v) => !v)}
                style={{
                  fontSize: "0.7rem",
                  fontWeight: value ? 600 : 400,
                  padding: "0.2rem 0.55rem",
                  borderRadius: 99,
                  border: `1px solid ${value ? color + "66" : "#2a2a3a"}`,
                  background: value ? color + "22" : "#0d0d1488",
                  color: value ? color : "#44445a",
                  cursor: "pointer",
                  backdropFilter: "blur(4px)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
        <section
          style={{
            flex: "0 0 380px",
            overflowY: "auto",
            borderLeft: "1px solid #1e1e2a",
            background: "#0d0d14",
          }}
        >
          <PriceTicker latestTick={latestPriceTick} />
          <EventList
            events={events}
            selectedId={selectedId}
            onSelectEvent={setSelectedId}
          />
          <div style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid #1a1a26',
            display: 'flex', gap: '1rem', flexWrap: 'wrap',
            fontSize: '0.72rem', color: '#33334a',
          }}>
            <a href="/terms" style={{ color: '#33334a', textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ color: '#33334a', textDecoration: 'none' }}>Privacy</a>
            <a href="/about" style={{ color: '#33334a', textDecoration: 'none' }}>About</a>
          </div>
        </section>
      </main>
    </div>
  );
}
