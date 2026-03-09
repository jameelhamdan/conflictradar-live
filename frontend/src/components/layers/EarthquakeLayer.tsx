'use client'

import { useEffect, useState } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import { fetchEarthquakes } from '../../api/streams'
import type { EarthquakeRecord } from '../../types'

const ALERT_COLORS: Record<string, string> = {
  red:    '#e05252',
  orange: '#e09652',
  yellow: '#e0c852',
  green:  '#52c8a0',
}

function quakeColor(alert: string, tsunami: boolean): string {
  if (tsunami) return '#e05252'
  return ALERT_COLORS[alert.toLowerCase()] ?? '#7c6ef8'
}

function quakeRadius(magnitude: number): number {
  // 3.0 → 4px, 5.0 → 8px, 7.0 → 16px, 9.0 → 28px
  return Math.max(4, Math.round(Math.pow(magnitude - 2, 1.6)))
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface EarthquakeLayerProps {
  /** Increment this counter to trigger a re-fetch */
  refresh: number
  minMagnitude?: number
  hours?: number
}

export default function EarthquakeLayer({ refresh, minMagnitude = 3.0, hours = 24 }: EarthquakeLayerProps) {
  const [quakes, setQuakes] = useState<EarthquakeRecord[]>([])

  useEffect(() => {
    fetchEarthquakes(minMagnitude, hours)
      .then(data => setQuakes(data.results))
      .catch(() => {})
  }, [refresh, minMagnitude, hours])

  return (
    <>
      {quakes.map(q => {
        const color = quakeColor(q.alert_level, q.tsunami_alert)
        const radius = quakeRadius(q.magnitude)
        return (
          <CircleMarker
            key={q.usgs_id}
            center={[q.latitude, q.longitude]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.35,
              weight: 1,
            }}
          >
            <Popup closeButton={false}>
              <div style={{ fontFamily: 'inherit', fontSize: '0.78rem', lineHeight: 1.4, minWidth: 180 }}>
                <div style={{ fontWeight: 700, color, marginBottom: 4, fontSize: '0.85rem' }}>
                  M{q.magnitude.toFixed(1)} {q.magnitude_type.toUpperCase()}
                  {q.tsunami_alert && <span style={{ marginLeft: 6, color: '#e05252', fontSize: '0.7rem' }}>⚠ TSUNAMI</span>}
                </div>
                <div style={{ color: '#ccc', marginBottom: 2 }}>{q.location_name}</div>
                {q.depth_km != null && (
                  <div style={{ color: '#888', fontSize: '0.7rem' }}>Depth: {q.depth_km.toFixed(0)} km</div>
                )}
                <div style={{ color: '#666', fontSize: '0.68rem', marginTop: 4 }}>{timeAgo(q.occurred_at)}</div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}
