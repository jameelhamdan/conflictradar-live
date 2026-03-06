'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { categoryColor, categoryIcon } from '../constants'
import { categoryShapeSvg } from '../shapes'
import { timeAgo, CategoryBadge, EventMeta } from './EventUI'
import NotamOverlay from './NotamOverlay'
import EarthquakeLayer from './EarthquakeLayer'
import StaticPointLayer from './StaticPointLayer'
import type { EventSummary } from '../types'

function intensitySize(intensity: number | null): number {
  if (!intensity) return 22
  return Math.round(22 + intensity * 18)
}

function makeMarkerIcon(category: string, color: string, size: number, selected: boolean): L.DivIcon {
  const html = categoryShapeSvg(category, size, color, selected)
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  })
}

interface Cluster {
  lat: number
  lng: number
  events: EventSummary[]
}

function buildClusters(events: EventSummary[], zoom: number): Cluster[] {
  const precision = zoom < 3 ? 0 : zoom < 5 ? 1 : zoom < 8 ? 2 : zoom < 11 ? 3 : 10
  const scale = Math.pow(10, precision)
  const groups = new Map<string, EventSummary[]>()
  for (const ev of events) {
    if (ev.latitude == null || ev.longitude == null) continue
    const key = `${Math.round(ev.latitude * scale)},${Math.round(ev.longitude * scale)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(ev)
  }
  return Array.from(groups.values()).map(evs => ({
    lat: evs.reduce((s, e) => s + e.latitude!, 0) / evs.length,
    lng: evs.reduce((s, e) => s + e.longitude!, 0) / evs.length,
    events: evs,
  }))
}

function makeClusterIcon(events: EventSummary[], selectedId: string | null): L.DivIcon {
  const count = events.length
  const size = Math.min(52, 30 + Math.log2(count + 1) * 5)
  const hasSelected = events.some(e => e.id === selectedId)

  // Dominant category color
  const catCount: Record<string, number> = {}
  for (const ev of events) catCount[ev.category] = (catCount[ev.category] ?? 0) + 1
  const dominant = Object.entries(catCount).sort(([, a], [, b]) => b - a)[0][0]
  const color = categoryColor(dominant)

  const glow = hasSelected ? `, 0 0 0 3px ${color}66` : ''
  const fontSize = size > 38 ? 14 : 12
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color}22;border:2px solid ${color}88;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.55)${glow}">
      <span style="color:${color};font-size:${fontSize}px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1">${count}</span>
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FlyToSelected({ events, selectedId }: { events: EventSummary[]; selectedId: string | null }) {
  const map = useMap()
  useEffect(() => {
    if (!selectedId) return
    const ev = events.find(e => e.id === selectedId)
    if (ev?.latitude && ev?.longitude) {
      map.flyTo([ev.latitude, ev.longitude], Math.max(map.getZoom(), 7), { duration: 0.8 })
    }
  }, [selectedId, events, map])
  return null
}

function FlyToLatest({ events }: { events: EventSummary[] }) {
  const map = useMap()
  const flewRef = useRef(false)
  useEffect(() => {
    if (flewRef.current || events.length === 0) return
    const ev = events.find(e => e.latitude != null && e.longitude != null)
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
}

function ClusteredMarkers({ events, selectedId, onSelectEvent }: ClusteredMarkersProps) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })

  const clusters = buildClusters(events, zoom)

  return (
    <>
      {clusters.map((cluster, i) => {
        if (cluster.events.length === 1) {
          const ev = cluster.events[0]
          const color = categoryColor(ev.category)
          const size = intensitySize(ev.avg_intensity)
          const selected = selectedId === ev.id
          const Icon = categoryIcon(ev.category)
          return (
            <Marker
              key={ev.id}
              position={[cluster.lat, cluster.lng]}
              icon={makeMarkerIcon(ev.category, color, size, selected)}
              eventHandlers={{ click: () => onSelectEvent(ev.id) }}
            >
              <Popup closeButton={false} className="cr-popup">
                <div style={{
                  width: 264,
                  borderLeft: `3px solid ${color}`,
                  background: '#16161f',
                  padding: '0.65rem 0.8rem',
                  fontFamily: 'inherit',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.32rem' }}>
                    <CategoryBadge category={ev.category} compact />
                    <span style={{ fontSize: '0.7rem', color: '#666' }}>{timeAgo(ev.started_at)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.35, marginBottom: '0.38rem', color: '#d8d8e8' }}>
                    {ev.title}
                  </div>
                  <EventMeta event={ev} compact />
                </div>
              </Popup>
            </Marker>
          )
        }

        // Cluster marker — popup lists all events
        return (
          <Marker
            key={`cluster-${cluster.lat.toFixed(4)}-${cluster.lng.toFixed(4)}-${i}`}
            position={[cluster.lat, cluster.lng]}
            icon={makeClusterIcon(cluster.events, selectedId)}
          >
            <Popup closeButton={false} className="cr-popup" maxWidth={300}>
              <div style={{
                width: 284,
                background: '#16161f',
                fontFamily: 'inherit',
                maxHeight: 380,
                overflowY: 'auto',
              }}>
                <div style={{
                  padding: '0.55rem 0.8rem',
                  borderBottom: '1px solid #2a2a3a',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#888',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  📍 {(() => {
                    const counts: Record<string, number> = {}
                    for (const ev of cluster.events) counts[ev.location_name] = (counts[ev.location_name] ?? 0) + 1
                    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
                  })()} · {cluster.events.length} events
                </div>
                {cluster.events.map(ev => {
                  const color = categoryColor(ev.category)
                  return (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev.id)}
                      style={{
                        padding: '0.55rem 0.8rem',
                        borderBottom: '1px solid #1e1e2a',
                        borderLeft: `3px solid ${color}`,
                        cursor: 'pointer',
                        background: selectedId === ev.id ? '#1e1e2e' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <CategoryBadge category={ev.category} compact />
                        <span style={{ fontSize: '0.68rem', color: '#555' }}>{timeAgo(ev.started_at)}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.3, color: '#d8d8e8', marginBottom: '0.2rem' }}>
                        {ev.title}
                      </div>
                      <EventMeta event={ev} compact showLocation={false} />
                    </div>
                  )
                })}
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
  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      minZoom={2}
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%', background: '#191920' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyToSelected events={events} selectedId={selectedId} />
      <FlyToLatest events={events} />
      <ClusteredMarkers events={events} selectedId={selectedId} onSelectEvent={onSelectEvent} />
      {showNotams && <NotamOverlay refresh={streamRefresh} />}
      {showEarthquakes && <EarthquakeLayer refresh={streamRefresh} />}
      {showStaticPoints && <StaticPointLayer />}
    </MapContainer>
  )
}
