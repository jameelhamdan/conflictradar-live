"use client";

import "../globals.css";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import EventList from "./events/EventList";
import PriceTicker from "./events/PriceTicker";
import { fetchEvents } from "../api/events";
import { useSSE } from "../hooks/useSSE";
import SiteHeader from "./SiteHeader";
import { categoryColor, categoryShapeComponent } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";
import { categoryLabel } from "../i18n/categories";
import type { EventSummary, EventFilters } from "../types";

const MapView = lazy(() => import("./events/MapView"));
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
  const { lang, t } = useLanguage();

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({ category: "" });
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("");
  const [mounted, setMounted] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Stream layers
  const [showNotams, setShowNotams] = useState(true);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showStaticPoints, setShowStaticPoints] = useState(true);
  const [streamRefresh, setStreamRefresh] = useState(0);
  const [latestPriceTick, setLatestPriceTick] = useState<{
    symbol: string;
    value: number;
    change_pct: number | null;
    occurred_at: string;
  } | null>(null);

  // SSE: push stream refresh counter and price updates
  useSSE((event) => {
    if (event.type === "notam_update" || event.type === "earthquake_update") {
      setStreamRefresh((n) => n + 1);
    }
    if (event.type === "price_tick") {
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
    } catch (e) {
      console.error(e);
    }
  }, [filters, quickFilter]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Track window size for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Trigger map resize when sidebar toggles on mobile
  useEffect(() => {
    if (isMobile) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 50);
    }
  }, [sidebarOpen, isMobile]);

  function clearQuickFilter() {
    setQuickFilter("");
  }

  function handleSelectEvent(id: string) {
    setSelectedId(id);
    if (isMobile) {
      setMobileTab("list");
      setSidebarOpen(true);
    }
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
        <SiteHeader showNav={!isMobile}>
          {/* Mobile sidebar toggle */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              style={{
                background: "none",
                border: "none",
                color: sidebarOpen ? "#7c9ef8" : "#55556a",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "0.2rem 0.4rem",
                width: "1.6rem",
                height: "1.6rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.12s",
                flexShrink: 0,
              }}
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>
          )}
          <div style={{ width: 1, height: 18, background: "#1e1e2a", flexShrink: 0 }} />
          {/* Time filters */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
              flex: 1,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
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
                    flexShrink: 0,
                    transition: "color 0.12s, background 0.12s, border-color 0.12s",
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
        </SiteHeader>

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
                  flexShrink: 0,
                  transition:
                    "color 0.12s, background 0.12s, border-color 0.12s",
                  letterSpacing: "0.01em",
                }}
              >
                {Shape ? (
                  <Shape size={10} color={active ? color : color + "bb"} />
                ) : (
                  <span
                    style={{ fontSize: "0.62rem", opacity: active ? 1 : 0.55 }}
                  >
                    ◉
                  </span>
                )}
                {categoryLabel(lang, tab.value || "all")}
              </button>
            );
          })}
        </div>
      </header>

      <main
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Map section — always rendered; on mobile fills the full main area */}
        <section
          style={{
            flex: isMobile ? (sidebarOpen ? 0 : 1) : "1 1 60%",
            minWidth: 0,
            position: "relative",
            display: isMobile && sidebarOpen ? "none" : "block",
          }}
        >
          {mounted && (
            <Suspense
              fallback={
                <div style={{ height: "100%", background: "#191920" }} />
              }
            >
              <MapView
                events={events}
                selectedId={selectedId}
                onSelectEvent={handleSelectEvent}
                streamRefresh={streamRefresh}
                showNotams={showNotams}
                showEarthquakes={showEarthquakes}
                showStaticPoints={showStaticPoints}
              />
            </Suspense>
          )}

          {/* Layer toggles — hidden on mobile when list tab is active */}
          {(!isMobile || mobileTab === "map") && (
            <div
              style={{
                position: "absolute",
                bottom: isMobile ? 16 : 28,
                left: 10,
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              {(
                [
                  {
                    key: "notams",
                    label: t.notams,
                    color: "#ff6644",
                    value: showNotams,
                    set: setShowNotams,
                  },
                  {
                    key: "earthquakes",
                    label: t.earthquakes,
                    color: "#7c6ef8",
                    value: showEarthquakes,
                    set: setShowEarthquakes,
                  },
                  {
                    key: "staticPoints",
                    label: t.locations,
                    color: "#4fc3f7",
                    value: showStaticPoints,
                    set: setShowStaticPoints,
                  },
                ] as const
              ).map(({ key, label, color, value, set }) => (
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
          )}
        </section>

        {/* List panel — fixed sidebar on desktop; full overlay on mobile */}
        <section
          style={{
            ...(isMobile
              ? {
                  position: "absolute",
                  inset: 0,
                  zIndex: 500,
                  display: mobileTab === "list" ? "flex" : "none",
                  flexDirection: "column",
                }
              : {
                  flex: "0 0 380px",
                  borderLeft: "1px solid #1e1e2a",
                }),
            overflowY: "auto",
            borderLeft: isMobile ? "none" : "1px solid #1e1e2a",

            background: "#0d0d14",
            display: isMobile && !sidebarOpen ? "none" : "flex",
            flexDirection: "column",
            minWidth: 0,
            flex: isMobile ? (sidebarOpen ? 1 : 0) : "0 0 380px",
          }}
        >
          <PriceTicker latestTick={latestPriceTick} />
          <EventList
            events={events}
            selectedId={selectedId}
            onSelectEvent={handleSelectEvent}
          />
        </section>
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav
          style={{
            flexShrink: 0,
            display: "flex",
            height: 52,
            background: "#13131c",
            borderTop: "1px solid #1e1e2a",
          }}
        >
          {(["map", "list"] as const).map((tab) => {
            const active = mobileTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setMobileTab(tab);
                  setSidebarOpen(tab === "list");
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.15rem",
                  background: "none",
                  border: "none",
                  borderTop: `2px solid ${active ? "#7c9ef8" : "transparent"}`,
                  color: active ? "#7c9ef8" : "#44445a",
                  fontSize: "0.7rem",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "color 0.12s",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>
                  {tab === "map" ? "⬡" : "☰"}
                </span>
                {tab === "map" ? t.mapTab : t.listTab}
              </button>
            );
          })}
          <a
            href="/newsletter"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.15rem",
              background: "none",
              border: "none",
              borderTop: "2px solid transparent",
              color: "#44445a",
              fontSize: "0.7rem",
              fontWeight: 400,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>✉</span>
            {t.briefingsTab}
          </a>
        </nav>
      )}
    </div>
  );
}
