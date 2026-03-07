"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { categoryColor } from "../../constants";
import { categoryShapeSvg } from "../shapes";
import { timeAgo, CategoryBadge, EventMeta } from "./EventUI";
import NotamOverlay from "./NotamOverlay";
import EarthquakeLayer from "./EarthquakeLayer";
import { fetchStaticPoints } from "../../api/streams";
import type { EventSummary, StaticPoint, StaticPointType } from "../../types";

// --- Static point helpers ---
const POINT_TYPE_COLOR: Record<StaticPointType, string> = {
  exchange:           '#4fc3f7',
  commodity_exchange: '#ffb74d',
  port:               '#81c784',
  central_bank:       '#ce93d8',
}
const POINT_TYPE_SYMBOL: Record<StaticPointType, string> = {
  exchange:           '◈',
  commodity_exchange: '◆',
  port:               '⚓',
  central_bank:       '◉',
}
const POINT_TYPE_LABEL: Record<StaticPointType, string> = {
  exchange:           'Stock Exchange',
  commodity_exchange: 'Commodity Exchange',
  port:               'Major Port',
  central_bank:       'Central Bank',
}

function countryFlag(code: string): string {
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('')
}

function makeStaticIcon(type: StaticPointType): L.DivIcon {
  const color = POINT_TYPE_COLOR[type]
  const symbol = POINT_TYPE_SYMBOL[type]
  const size = 18
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:3px;background:${color}22;border:1.5px solid ${color}99;display:flex;align-items:center;justify-content:center;font-size:10px;color:${color};line-height:1">${symbol}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })
}

function StaticPointCard({ point }: { point: StaticPoint }) {
  const type = point.point_type as StaticPointType
  const color = POINT_TYPE_COLOR[type]
  const symbol = POINT_TYPE_SYMBOL[type]
  const label = POINT_TYPE_LABEL[type]
  const flag = countryFlag(point.country_code)
  const m = point.metadata
  return (
    <div style={{ borderLeft: `3px solid ${color}`, background: "#16161f", padding: "0.65rem 0.8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.32rem" }}>
        <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: 3, background: color + "22", color, border: `1px solid ${color}55`, fontWeight: 600 }}>
          {symbol} {label}
        </span>
        <span style={{ fontSize: "0.68rem", color: "#666" }}>{flag} {point.country_code}</span>
      </div>
      <div style={{ fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.35, marginBottom: "0.35rem", color: "#d8d8e8" }}>
        {point.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.35rem" }}>
        <span style={{ fontSize: "0.72rem", color: "#888899" }}>{point.country}</span>
        <span style={{ fontSize: "0.63rem", padding: "1px 5px", borderRadius: 3, background: color + "22", color, border: `1px solid ${color}44` }}>{point.code}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {(type === 'exchange' || type === 'central_bank') && Boolean(m.timezone) && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.7rem" }}>
            <span style={{ color: "#888899" }}>Timezone</span>
            <span style={{ color: "#c8c8d8" }}>{String(m.timezone)}</span>
          </div>
        )}
        {type === 'central_bank' && Boolean(m.currency) && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.7rem" }}>
            <span style={{ color: "#888899" }}>Currency</span>
            <span style={{ color: "#c8c8d8" }}>{String(m.currency)}</span>
          </div>
        )}
        {(type === 'exchange' || type === 'central_bank') && Boolean(m.website) && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.7rem" }}>
            <span style={{ color: "#888899" }}>Website</span>
            <a href={`https://${String(m.website)}`} target="_blank" rel="noopener noreferrer"
              style={{ color, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
            >{String(m.website)}</a>
          </div>
        )}
        {type === 'commodity_exchange' && Array.isArray(m.products) && (
          <div>
            <div style={{ fontSize: "0.68rem", color: "#888899", marginBottom: 4 }}>Products</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {(m.products as string[]).map(p => (
                <span key={p} style={{ fontSize: "0.63rem", padding: "1px 6px", borderRadius: 3, background: color + "18", color, border: `1px solid ${color}44` }}>{p}</span>
              ))}
            </div>
          </div>
        )}
        {type === 'port' && (
          <>
            {Boolean(m.type) && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.7rem" }}>
                <span style={{ color: "#888899" }}>Port type</span>
                <span style={{ color: "#c8c8d8" }}>{String(m.type)}</span>
              </div>
            )}
            {Boolean(m.teu_rank) && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: "0.7rem" }}>
                <span style={{ color: "#888899" }}>TEU rank</span>
                <span style={{ color: "#c8c8d8" }}>{`#${String(m.teu_rank)} globally`}</span>
              </div>
            )}
            {Boolean(m.note) && (
              <div style={{ fontSize: "0.68rem", color: "#888899", fontStyle: "italic", marginTop: 2 }}>{String(m.note)}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function intensitySize(intensity: number | null): number {
  if (!intensity) return 22;
  return Math.round(22 + intensity * 18);
}

function makeMarkerIcon(
  category: string,
  color: string,
  size: number,
  selected: boolean,
): L.DivIcon {
  const html = categoryShapeSvg(category, size, color, selected);
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  });
}

interface Cluster {
  lat: number;
  lng: number;
  events: EventSummary[];
  staticPoints: StaticPoint[];
}

function buildClusters(events: EventSummary[], staticPoints: StaticPoint[], zoom: number): Cluster[] {
  const precision =
    zoom < 3 ? 0 : zoom < 5 ? 1 : zoom < 8 ? 2 : zoom < 11 ? 3 : 10;
  const scale = Math.pow(10, precision);
  const groups = new Map<string, { evs: EventSummary[]; sps: StaticPoint[] }>();
  for (const ev of events) {
    if (ev.latitude == null || ev.longitude == null) continue;
    const key = `${Math.round(ev.latitude * scale)},${Math.round(ev.longitude * scale)}`;
    if (!groups.has(key)) groups.set(key, { evs: [], sps: [] });
    groups.get(key)!.evs.push(ev);
  }
  for (const sp of staticPoints) {
    const key = `${Math.round(sp.latitude * scale)},${Math.round(sp.longitude * scale)}`;
    if (!groups.has(key)) groups.set(key, { evs: [], sps: [] });
    groups.get(key)!.sps.push(sp);
  }
  return Array.from(groups.values()).map(({ evs, sps }) => {
    const allLats = [...evs.map(e => e.latitude!), ...sps.map(s => s.latitude)];
    const allLngs = [...evs.map(e => e.longitude!), ...sps.map(s => s.longitude)];
    return {
      lat: allLats.reduce((s, v) => s + v, 0) / allLats.length,
      lng: allLngs.reduce((s, v) => s + v, 0) / allLngs.length,
      events: evs,
      staticPoints: sps,
    };
  });
}

function makeClusterIcon(
  events: EventSummary[],
  selectedId: string | null,
): L.DivIcon {
  const count = events.length;
  const size = Math.min(52, 30 + Math.log2(count + 1) * 5);
  const hasSelected = events.some((e) => e.id === selectedId);

  // Dominant category color
  const catCount: Record<string, number> = {};
  for (const ev of events)
    catCount[ev.category] = (catCount[ev.category] ?? 0) + 1;
  const dominant = Object.entries(catCount).sort(([, a], [, b]) => b - a)[0][0];
  const color = categoryColor(dominant);

  const glow = hasSelected ? `, 0 0 0 3px ${color}66` : "";
  const fontSize = size > 38 ? 14 : 12;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color}22;border:2px solid ${color}88;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.55)${glow}">
      <span style="color:${color};font-size:${fontSize}px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1">${count}</span>
    </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToSelected({
  events,
  selectedId,
}: {
  events: EventSummary[];
  selectedId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const ev = events.find((e) => e.id === selectedId);
    if (ev?.latitude && ev?.longitude) {
      map.flyTo([ev.latitude, ev.longitude], Math.max(map.getZoom(), 7), {
        duration: 0.8,
      });
    }
  }, [selectedId, events, map]);
  return null;
}

function FlyToLatest({ events }: { events: EventSummary[] }) {
  const map = useMap();
  const flewRef = useRef(false);
  useEffect(() => {
    if (flewRef.current || events.length === 0) return;
    const ev = events.find((e) => e.latitude != null && e.longitude != null);
    if (ev) {
      map.setView([ev.latitude!, ev.longitude!], 4, { animate: false });
      flewRef.current = true;
    }
  }, [events, map]);
  return null;
}

interface ClusteredMarkersProps {
  events: EventSummary[];
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
  staticPoints: StaticPoint[];
  showStaticPoints: boolean;
}

function ClusteredMarkers({
  events,
  selectedId,
  onSelectEvent,
  staticPoints,
  showStaticPoints,
}: ClusteredMarkersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const visibleStatic = showStaticPoints ? staticPoints : [];
  const clusters = buildClusters(events, visibleStatic, zoom);

  return (
    <>
      {clusters.map((cluster, i) => {
        const hasEvents = cluster.events.length > 0;
        const hasSps = cluster.staticPoints.length > 0;

        // Solo static point(s), no events at this location
        if (!hasEvents && hasSps) {
          const sp = cluster.staticPoints[0];
          const spColor = POINT_TYPE_COLOR[sp.point_type as StaticPointType];
          return (
            <Marker
              key={`sp-${cluster.staticPoints.map(s => s.code).join('-')}`}
              position={[cluster.lat, cluster.lng]}
              icon={makeStaticIcon(sp.point_type as StaticPointType)}
            >
              <Popup closeButton={false} className="cr-popup">
                <div style={{ width: 264, background: "#16161f", fontFamily: "inherit" }}>
                  {cluster.staticPoints.map((s, si) => (
                    <div key={s.code}>
                      {si > 0 && <div style={{ height: 1, background: "#2a2a3a" }} />}
                      <StaticPointCard point={s} />
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        }

        // Single event (with or without co-located static points)
        if (cluster.events.length === 1) {
          const ev = cluster.events[0];
          const color = categoryColor(ev.category);
          const size = intensitySize(ev.avg_intensity);
          const selected = selectedId === ev.id;
          return (
            <Marker
              key={ev.id}
              position={[cluster.lat, cluster.lng]}
              icon={makeMarkerIcon(ev.category, color, size, selected)}
              eventHandlers={{ click: () => onSelectEvent(ev.id) }}
            >
              <Popup closeButton={false} className="cr-popup">
                <div style={{ width: 264, background: "#16161f", fontFamily: "inherit" }}>
                  <div
                    style={{
                      borderLeft: `3px solid ${color}`,
                      padding: "0.65rem 0.8rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.32rem",
                      }}
                    >
                      <CategoryBadge category={ev.category} compact />
                      <span style={{ fontSize: "0.7rem", color: "#666" }}>
                        {timeAgo(ev.started_at)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        lineHeight: 1.35,
                        marginBottom: "0.38rem",
                        color: "#d8d8e8",
                      }}
                    >
                      {ev.title}
                    </div>
                    <EventMeta event={ev} compact />
                  </div>
                  {cluster.staticPoints.map((sp) => (
                    <div key={sp.code}>
                      <div style={{ height: 1, background: "#2a2a3a" }} />
                      <StaticPointCard point={sp} />
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        }

        // Multiple events (with or without co-located static points)
        return (
          <Marker
            key={`cluster-${cluster.lat.toFixed(4)}-${cluster.lng.toFixed(4)}-${i}`}
            position={[cluster.lat, cluster.lng]}
            icon={makeClusterIcon(cluster.events, selectedId)}
          >
            <Popup closeButton={false} className="cr-popup" maxWidth={300}>
              <div
                style={{
                  width: 284,
                  background: "#16161f",
                  fontFamily: "inherit",
                  maxHeight: 420,
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    padding: "0.55rem 0.8rem",
                    borderBottom: "1px solid #2a2a3a",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#888",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  📍{" "}
                  {(() => {
                    const counts: Record<string, number> = {};
                    for (const ev of cluster.events)
                      counts[ev.location_name] =
                        (counts[ev.location_name] ?? 0) + 1;
                    return Object.entries(counts).sort(
                      ([, a], [, b]) => b - a,
                    )[0][0];
                  })()}{" "}
                  · {cluster.events.length} events
                </div>
                {cluster.events.map((ev) => {
                  const color = categoryColor(ev.category);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev.id)}
                      style={{
                        padding: "0.55rem 0.8rem",
                        borderBottom: "1px solid #1e1e2a",
                        borderLeft: `3px solid ${color}`,
                        cursor: "pointer",
                        background:
                          selectedId === ev.id ? "#1e1e2e" : "transparent",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <CategoryBadge category={ev.category} compact />
                        <span style={{ fontSize: "0.68rem", color: "#555" }}>
                          {timeAgo(ev.started_at)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 500,
                          lineHeight: 1.3,
                          color: "#d8d8e8",
                          marginBottom: "0.2rem",
                        }}
                      >
                        {ev.title}
                      </div>
                      <EventMeta event={ev} compact showLocation={false} />
                    </div>
                  );
                })}
                {cluster.staticPoints.map((sp) => (
                  <div key={sp.code}>
                    <div style={{ height: 1, background: "#2a2a3a" }} />
                    <StaticPointCard point={sp} />
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

interface MapViewProps {
  events: EventSummary[];
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
  streamRefresh: number;
  showNotams: boolean;
  showEarthquakes: boolean;
  showStaticPoints: boolean;
}

export default function MapView({
  events,
  selectedId,
  onSelectEvent,
  streamRefresh,
  showNotams,
  showEarthquakes,
  showStaticPoints,
}: MapViewProps) {
  const [staticPoints, setStaticPoints] = useState<StaticPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchStaticPoints()
      .then((data) => {
        if (!cancelled) setStaticPoints(data.results);
      })
      .catch(() => {
        // best-effort — static points are optional
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      minZoom={3}
      maxBounds={[
        [-90, -180],
        [90, 180],
      ]}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%", background: "#191920" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyToSelected events={events} selectedId={selectedId} />
      <FlyToLatest events={events} />
      <ClusteredMarkers
        events={events}
        selectedId={selectedId}
        onSelectEvent={onSelectEvent}
        staticPoints={staticPoints}
        showStaticPoints={showStaticPoints}
      />
      {showNotams && <NotamOverlay refresh={streamRefresh} />}
      {showEarthquakes && <EarthquakeLayer refresh={streamRefresh} />}
    </MapContainer>
  );
}
