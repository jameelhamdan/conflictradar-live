"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import EventList from "../components/events/EventList";
import PriceTicker from "../components/events/PriceTicker";
import { fetchEvents } from "../api/events";
import { useSSE } from "../hooks/useSSE";
import { SiteHeader } from "../components/layout";
import { categoryColor, categoryShapeComponent } from "@/components/category";
import { useLanguage } from "../contexts/LanguageContext";
import { categoryLabel } from "../i18n/categories";
import type { EventSummary, EventFilters } from "../types";
import { cn } from "@/lib/utils";

const MapView = lazy(() => import("../components/events/MapView"));
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

const OVERLAY_CONTROLS = [
  { key: "notams", color: "#ff6644" },
  { key: "earthquakes", color: "#7c6ef8" },
  { key: "staticPoints", color: "#4fc3f7" },
] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number]["value"] | "";

export default function IndexPage() {
  const { lang, t } = useLanguage();

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({ category: "" });
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("");
  const [mounted, setMounted] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const overlayState = { notams: showNotams, earthquakes: showEarthquakes, staticPoints: showStaticPoints };
  const overlaySetters = {
    notams: setShowNotams,
    earthquakes: setShowEarthquakes,
    staticPoints: setShowStaticPoints,
  };
  const overlayLabels = { notams: t.notams, earthquakes: t.earthquakes, staticPoints: t.locations };

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
        effectiveFilters = { ...filters, start: new Date(Date.now() - offsetMs).toISOString() };
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
    <div className="flex h-screen flex-col overflow-hidden bg-app-bg text-app-text-primary">
      <header className="shrink-0 border-b border-app-border bg-app-surface">
        <SiteHeader showNav={!isMobile}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              className={cn(
                "flex h-[1.6rem] w-[1.6rem] shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-[0.2rem] text-[1.2rem] transition-colors duration-[120ms]",
                sidebarOpen ? "text-app-accent-blue" : "text-app-text-muted",
              )}
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>
          )}
          <div className="h-[18px] w-px shrink-0 bg-app-border" />
          <div className="flex flex-1 items-center gap-[0.2rem] overflow-x-auto [scrollbar-width:none]">
            {QUICK_FILTERS.map((qf) => {
              const active = quickFilter === qf.value;
              return (
                <button
                  key={qf.value}
                  onClick={() => {
                    setQuickFilter(active ? "" : qf.value);
                    setFilters((f) => ({ ...f, start: "", end: "" }));
                  }}
                  className={cn("qf-btn", active ? "qf-btn-active" : "qf-btn-inactive")}
                >
                  {qf.label}
                </button>
              );
            })}
            {quickFilter && (
              <button
                onClick={clearQuickFilter}
                title="Clear time filter"
                className="shrink-0 cursor-pointer rounded border-none bg-transparent px-[0.25rem] py-[0.1rem] text-[0.7rem] leading-none text-app-text-ghost"
              >
                ✕
              </button>
            )}
          </div>
        </SiteHeader>

        <div className="flex h-[34px] items-center gap-[0.2rem] overflow-x-auto px-3 [scrollbar-width:none]">
          {CATEGORY_TABS.map((tab) => {
            const active = filters.category === tab.value;
            const color = tab.value ? categoryColor(tab.value) : "var(--app-accent-blue)";
            const Shape = tab.value ? categoryShapeComponent(tab.value) : null;
            return (
              <button
                key={tab.value}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    category: tab.value !== "" && f.category === tab.value ? "" : tab.value,
                  }))
                }
                className={cn("cat-tab", active ? "cat-tab-active" : "cat-tab-inactive")}
                style={{ "--cat-color": color } as React.CSSProperties}
              >
                {Shape ? (
                  <Shape size={10} color={active ? color : color + "bb"} />
                ) : (
                  <span className={cn("text-[0.62rem]", active ? "opacity-100" : "opacity-55")}>◉</span>
                )}
                {categoryLabel(lang, tab.value || "all")}
              </button>
            );
          })}
        </div>
      </header>

      <main className="relative flex flex-1 overflow-hidden">
        <section
          className={cn(
            "relative min-w-0",
            isMobile ? (sidebarOpen ? "hidden" : "block flex-1") : "block flex-[1_1_60%]",
          )}
        >
          {mounted && (
            <Suspense fallback={<div className="h-full bg-app-panel" />}>
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

          {(!isMobile || mobileTab === "map") && (
            <div className="absolute left-[10px] z-[1000] flex flex-col gap-1" style={{ bottom: isMobile ? 16 : 28 }}>
              {OVERLAY_CONTROLS.map(({ key, color }) => {
                const active = overlayState[key];
                return (
                  <button
                    key={key}
                    onClick={() => overlaySetters[key]((v) => !v)}
                    className={cn("overlay-btn", active ? "overlay-btn-active" : "overlay-btn-inactive")}
                    style={{ "--overlay-color": color } as React.CSSProperties}
                  >
                    {overlayLabels[key]}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section
          className={cn(
            "flex min-w-0 flex-col overflow-y-auto bg-app-panel",
            isMobile
              ? cn("absolute inset-0 z-[500]", !sidebarOpen && "hidden")
              : "flex-[0_0_380px] border-l border-app-border",
          )}
        >
          <PriceTicker latestTick={latestPriceTick} />
          <EventList events={events} selectedId={selectedId} onSelectEvent={handleSelectEvent} />
        </section>
      </main>

      {isMobile && (
        <nav className="flex h-[52px] shrink-0 border-t border-app-border bg-app-surface">
          {(["map", "list"] as const).map((tab) => {
            const active = mobileTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setMobileTab(tab);
                  setSidebarOpen(tab === "list");
                }}
                className={cn("mobile-nav-btn", active ? "mobile-nav-btn-active" : "mobile-nav-btn-inactive")}
              >
                <span className="text-[1.05rem] leading-none">{tab === "map" ? "⬡" : "☰"}</span>
                {tab === "map" ? t.mapTab : t.listTab}
              </button>
            );
          })}
          <a href="/newsletter" className="mobile-nav-link">
            <span className="text-[1.05rem] leading-none">✉</span>
            {t.briefingsTab}
          </a>
        </nav>
      )}
    </div>
  );
}
