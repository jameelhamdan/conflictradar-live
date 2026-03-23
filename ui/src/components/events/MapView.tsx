"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useState, useRef, useEffect } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet"
import { categoryColor } from "@/components/category"
import { categoryShapeSvg } from "../category"
import { timeAgo, CategoryBadge, EventMeta, useLocalizedField } from "./EventUI"
import NotamOverlay from "../layers/NotamOverlay"
import EarthquakeLayer from "../layers/EarthquakeLayer"
import { fetchStaticPoints } from "../../api/streams"
import { useLanguage } from "../../contexts/LanguageContext"
import type { EventSummary, StaticPoint, StaticPointType } from "../../types"
import { cn } from "@/lib/utils"

const POINT_TYPE_COLOR: Record<StaticPointType, string> = {
  exchange: "#4fc3f7",
  commodity_exchange: "#ffb74d",
  port: "#81c784",
  central_bank: "#ce93d8",
}
const POINT_TYPE_SYMBOL: Record<StaticPointType, string> = {
  exchange: "◈",
  commodity_exchange: "◆",
  port: "⚓",
  central_bank: "◉",
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("")
}

function makeStaticIcon(type: StaticPointType): L.DivIcon {
  const color = POINT_TYPE_COLOR[type]
  const symbol = POINT_TYPE_SYMBOL[type]
  const size = 18
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:3px;background:${color}22;border:1.5px solid ${color}99;display:flex;align-items:center;justify-content:center;font-size:10px;color:${color};line-height:1">${symbol}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })
}

function StaticPointCard({ point }: { point: StaticPoint }) {
  const { t } = useLanguage()
  const type = point.point_type as StaticPointType
  const color = POINT_TYPE_COLOR[type]
  const symbol = POINT_TYPE_SYMBOL[type]
  const label = t.pointTypeLabels[type] ?? type
  const flag = countryFlag(point.country_code)
  const m = point.metadata
  return (
    <div
      className="bg-app-card px-[0.8rem] py-[0.65rem]"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="mb-[0.32rem] flex items-center justify-between">
        <span
          className="rounded-[3px] px-[6px] py-[1px] text-[0.65rem] font-semibold"
          style={{
            background: color + "22",
            color,
            border: `1px solid ${color}55`,
          }}
        >
          {symbol} {label}
        </span>
        <span className="text-[0.68rem] text-app-text-muted">
          {flag} {point.country_code}
        </span>
      </div>
      <div className="mb-[0.35rem] text-[0.85rem] font-medium leading-[1.35] text-app-text-body">
        {point.name}
      </div>
      <div className="mb-[0.35rem] flex items-center gap-[6px]">
        <span className="text-[0.72rem] text-app-text-secondary">
          {point.country}
        </span>
        <span
          className="rounded-[3px] px-[5px] py-[1px] text-[0.63rem]"
          style={{
            background: color + "22",
            color,
            border: `1px solid ${color}44`,
          }}
        >
          {point.code}
        </span>
      </div>
      <div className="flex flex-col gap-[2px]">
        {(type === "exchange" || type === "central_bank") &&
          Boolean(m.timezone) && (
            <div className="flex justify-between gap-[12px] text-[0.7rem]">
              <span className="text-app-text-secondary">{t.mapTimezone}</span>
              <span className="text-app-text-body-dim">{String(m.timezone)}</span>
            </div>
          )}
        {type === "central_bank" && Boolean(m.currency) && (
          <div className="flex justify-between gap-[12px] text-[0.7rem]">
            <span className="text-app-text-secondary">{t.mapCurrency}</span>
            <span className="text-app-text-body-dim">{String(m.currency)}</span>
          </div>
        )}
        {(type === "exchange" || type === "central_bank") &&
          Boolean(m.website) && (
            <div className="flex justify-between gap-[12px] text-[0.7rem]">
              <span className="text-app-text-secondary">{t.mapWebsite}</span>
              <a
                href={`https://${String(m.website)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline hover:underline"
                style={{ color }}
              >
                {String(m.website)}
              </a>
            </div>
          )}
        {type === "commodity_exchange" && Array.isArray(m.products) && (
          <div>
            <div className="mb-1 text-[0.68rem] text-app-text-secondary">
              {t.mapProducts}
            </div>
            <div className="flex flex-wrap gap-1">
              {(m.products as string[]).map((p) => (
                <span
                  key={p}
                  className="rounded-[3px] px-[6px] py-[1px] text-[0.63rem]"
                  style={{
                    background: color + "18",
                    color,
                    border: `1px solid ${color}44`,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
        {type === "port" && (
          <>
            {Boolean(m.type) && (
              <div className="flex justify-between gap-[12px] text-[0.7rem]">
                <span className="text-app-text-secondary">{t.mapPortType}</span>
                <span className="text-app-text-body-dim">{String(m.type)}</span>
              </div>
            )}
            {Boolean(m.teu_rank) && (
              <div className="flex justify-between gap-[12px] text-[0.7rem]">
                <span className="text-app-text-secondary">{t.mapTeuRankLabel}</span>
                <span className="text-app-text-body-dim">
                  {t.mapTeuRank(m.teu_rank as string | number)}
                </span>
              </div>
            )}
            {Boolean(m.note) && (
              <div className="mt-[2px] text-[0.68rem] italic text-app-text-secondary">
                {String(m.note)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function intensitySize(intensity: number | null): number {
  if (!intensity) return 22
  return Math.round(22 + intensity * 18)
}

function makeMarkerIcon(
  category: string,
  color: string,
  size: number,
  selected: boolean
): L.DivIcon {
  const html = categoryShapeSvg(category, size, color, selected)
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  })
}

interface Cluster {
  lat: number
  lng: number
  events: EventSummary[]
  staticPoints: StaticPoint[]
}

function buildClusters(
  events: EventSummary[],
  staticPoints: StaticPoint[],
  zoom: number
): Cluster[] {
  const precision =
    zoom < 3 ? 0 : zoom < 5 ? 1 : zoom < 8 ? 2 : zoom < 11 ? 3 : 10
  const scale = Math.pow(10, precision)
  const groups = new Map<string, { evs: EventSummary[]; sps: StaticPoint[] }>()
  for (const ev of events) {
    if (ev.latitude == null || ev.longitude == null) continue
    const key = `${Math.round(ev.latitude * scale)},${Math.round(
      ev.longitude * scale
    )}`
    if (!groups.has(key)) groups.set(key, { evs: [], sps: [] })
    groups.get(key)!.evs.push(ev)
  }
  for (const sp of staticPoints) {
    const key = `${Math.round(sp.latitude * scale)},${Math.round(
      sp.longitude * scale
    )}`
    if (!groups.has(key)) groups.set(key, { evs: [], sps: [] })
    groups.get(key)!.sps.push(sp)
  }
  return Array.from(groups.values()).map(({ evs, sps }) => {
    const allLats = [
      ...evs.map((e) => e.latitude!),
      ...sps.map((s) => s.latitude),
    ]
    const allLngs = [
      ...evs.map((e) => e.longitude!),
      ...sps.map((s) => s.longitude),
    ]
    return {
      lat: allLats.reduce((s, v) => s + v, 0) / allLats.length,
      lng: allLngs.reduce((s, v) => s + v, 0) / allLngs.length,
      events: evs,
      staticPoints: sps,
    }
  })
}

function makeClusterIcon(
  events: EventSummary[],
  selectedId: string | null
): L.DivIcon {
  const count = events.length
  const size = Math.min(52, 30 + Math.log2(count + 1) * 5)
  const hasSelected = events.some((e) => e.id === selectedId)

  const catCount: Record<string, number> = {}
  for (const ev of events)
    catCount[ev.category] = (catCount[ev.category] ?? 0) + 1
  const dominant = Object.entries(catCount).sort(([, a], [, b]) => b - a)[0][0]
  const color = categoryColor(dominant)

  const glow = hasSelected ? `, 0 0 0 3px ${color}66` : ""
  const fontSize = size > 38 ? 14 : 12
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color}22;border:2px solid ${color}88;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.55)${glow}">
      <span style="color:${color};font-size:${fontSize}px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1">${count}</span>
    </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FlyToSelected({
  events,
  selectedId,
}: {
  events: EventSummary[]
  selectedId: string | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!selectedId) return
    const ev = events.find((e) => e.id === selectedId)
    if (ev?.latitude && ev?.longitude) {
      map.flyTo([ev.latitude, ev.longitude], Math.max(map.getZoom(), 7), {
        duration: 0.8,
      })
    }
  }, [selectedId, events, map])
  return null
}

function FlyToLatest({ events }: { events: EventSummary[] }) {
  const map = useMap()
  const flewRef = useRef(false)
  useEffect(() => {
    if (flewRef.current || events.length === 0) return
    const ev = events.find((e) => e.latitude != null && e.longitude != null)
    if (ev) {
      map.setView([ev.latitude!, ev.longitude!], 4, { animate: false })
      flewRef.current = true
    }
  }, [events, map])
  return null
}

interface ClusteredMarkersProps {
  events: EventSummary[]
  selectedId: string | null
  onSelectEvent: (id: string) => void
  staticPoints: StaticPoint[]
  showStaticPoints: boolean
}

function ClusteredMarkers({
  events,
  selectedId,
  onSelectEvent,
  staticPoints,
  showStaticPoints,
}: ClusteredMarkersProps) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })
  const { lang, t } = useLanguage()
  const pick = useLocalizedField()

  const visibleStatic = showStaticPoints ? staticPoints : []
  const clusters = buildClusters(events, visibleStatic, zoom)

  return (
    <>
      {clusters.map((cluster, i) => {
        const hasEvents = cluster.events.length > 0
        const hasSps = cluster.staticPoints.length > 0

        if (!hasEvents && hasSps) {
          const sp = cluster.staticPoints[0]
          return (
            <Marker
              key={`sp-${cluster.staticPoints.map((s) => s.code).join("-")}`}
              position={[cluster.lat, cluster.lng]}
              icon={makeStaticIcon(sp.point_type as StaticPointType)}
            >
              <Popup closeButton={false} className="cr-popup">
                <div
                  className="w-[264px] bg-app-card"
                  style={{ fontFamily: "inherit" }}
                >
                  {cluster.staticPoints.map((s, si) => (
                    <div key={s.code}>
                      {si > 0 && <div className="h-px bg-app-border-subtle" />}
                      <StaticPointCard point={s} />
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          )
        }

        if (cluster.events.length === 1) {
          const ev = cluster.events[0]
          const color = categoryColor(ev.category)
          const size = intensitySize(ev.avg_intensity)
          const selected = selectedId === ev.id
          return (
            <Marker
              key={ev.id}
              position={[cluster.lat, cluster.lng]}
              icon={makeMarkerIcon(ev.category, color, size, selected)}
              eventHandlers={{ click: () => onSelectEvent(ev.id) }}
            >
              <Popup closeButton={false} className="cr-popup">
                <div
                  className="w-[264px] bg-app-card"
                  style={{ fontFamily: "inherit" }}
                >
                  <div
                    className="px-[0.8rem] py-[0.65rem]"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <div className="mb-[0.32rem] flex items-center justify-between">
                      <CategoryBadge category={ev.category} compact />
                      <span className="text-[0.7rem] text-app-text-muted">
                        {timeAgo(ev.started_at, lang)}
                      </span>
                    </div>
                    <div className="mb-[0.38rem] text-[0.85rem] font-medium leading-[1.35] text-app-text-body">
                      {pick(ev as unknown as Record<string, unknown>, "title")}
                    </div>
                    <EventMeta event={ev} compact />
                  </div>
                  {cluster.staticPoints.map((sp) => (
                    <div key={sp.code}>
                      <div className="h-px bg-app-border-subtle" />
                      <StaticPointCard point={sp} />
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          )
        }

        return (
          <Marker
            key={`cluster-${cluster.lat.toFixed(4)}-${cluster.lng.toFixed(
              4
            )}-${i}`}
            position={[cluster.lat, cluster.lng]}
            icon={makeClusterIcon(cluster.events, selectedId)}
          >
            <Popup closeButton={false} className="cr-popup" maxWidth={300}>
              <div
                className="w-[284px] max-h-[420px] overflow-y-auto bg-app-card"
                style={{ fontFamily: "inherit" }}
              >
                <div className="border-b border-app-border-subtle px-[0.8rem] py-[0.55rem] text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-app-text-secondary">
                  📍{" "}
                  {(() => {
                    const counts: Record<string, number> = {}
                    for (const ev of cluster.events)
                      counts[ev.location_name] =
                        (counts[ev.location_name] ?? 0) + 1
                    return Object.entries(counts).sort(
                      ([, a], [, b]) => b - a
                    )[0][0]
                  })()}{" "}
                  · {t.eventCount(cluster.events.length)}
                </div>
                {cluster.events.map((ev) => {
                  const color = categoryColor(ev.category)
                  return (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev.id)}
                      className={cn(
                        "cursor-pointer border-b border-app-border px-[0.8rem] py-[0.55rem]",
                        selectedId === ev.id
                          ? "bg-app-card-selected"
                          : "bg-transparent"
                      )}
                      style={{ borderLeft: `3px solid ${color}` }}
                    >
                      <div className="mb-[0.2rem] flex items-center justify-between">
                        <CategoryBadge category={ev.category} compact />
                        <span className="text-[0.68rem] text-app-text-ghost">
                          {timeAgo(ev.started_at, lang)}
                        </span>
                      </div>
                      <div className="mb-[0.2rem] text-[0.82rem] font-medium leading-[1.3] text-app-text-body">
                        {pick(
                          ev as unknown as Record<string, unknown>,
                          "title"
                        )}
                      </div>
                      <EventMeta event={ev} compact showLocation={false} />
                    </div>
                  )
                })}
                {cluster.staticPoints.map((sp) => (
                  <div key={sp.code}>
                    <div className="h-px bg-app-border-subtle" />
                    <StaticPointCard point={sp} />
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

interface MapViewProps {
  events: EventSummary[]
  selectedId: string | null
  onSelectEvent: (id: string) => void
  streamRefresh: number
  showNotams: boolean
  showEarthquakes: boolean
  showStaticPoints: boolean
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
  const [staticPoints, setStaticPoints] = useState<StaticPoint[]>([])

  useEffect(() => {
    let cancelled = false
    fetchStaticPoints()
      .then((data) => {
        if (!cancelled) setStaticPoints(data.results)
      })
      .catch(() => {
        // optional layer
      })
    return () => {
      cancelled = true
    }
  }, [])

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
      className="h-full w-full bg-app-surface [direction:ltr]"
      zoomControl
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
  )
}
