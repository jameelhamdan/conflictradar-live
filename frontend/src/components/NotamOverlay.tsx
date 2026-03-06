'use client'

import { useEffect, useState } from 'react'
import { GeoJSON, Tooltip } from 'react-leaflet'
import type { PathOptions } from 'leaflet'
import { fetchNotamZones } from '../api/streams'
import type { NotamZone } from '../types'

const NOTAM_TYPE_COLOR: Record<string, string> = {
  tfr:        '#ff4444',
  prohibited: '#cc0000',
  restricted: '#ff8800',
  danger:     '#ffcc00',
  warning:    '#ff8800',
  caution:    '#ffdd44',
  general:    '#cc88ff',
}

function notamColor(type: string): string {
  return NOTAM_TYPE_COLOR[type.toLowerCase()] ?? '#cc44ff'
}

function zoneStyle(zone: NotamZone): PathOptions {
  const color = notamColor(zone.notam_type)
  return {
    color,
    fillColor: color,
    fillOpacity: 0.12,
    weight: 1.5,
    dashArray: '4 3',
  }
}

interface NotamOverlayProps {
  /** Increment this counter to trigger a zone re-fetch */
  refresh: number
}

export default function NotamOverlay({ refresh }: NotamOverlayProps) {
  const [zones, setZones] = useState<NotamZone[]>([])

  useEffect(() => {
    fetchNotamZones(true)
      .then(data => setZones(data.results))
      .catch(() => {})
  }, [refresh])

  return (
    <>
      {zones.map(zone => {
        const geom = zone.geometry
        if (!geom || !geom.geometry) return null
        const color = notamColor(zone.notam_type)
        return (
          <GeoJSON
            key={zone.notam_id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={geom as any}
            style={() => zoneStyle(zone)}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: 'inherit', fontSize: '0.75rem', lineHeight: 1.4 }}>
                <div style={{ fontWeight: 600, color, marginBottom: 2 }}>
                  {zone.notam_type.toUpperCase()} · {zone.notam_id}
                </div>
                {zone.location_name && <div style={{ color: '#aaa' }}>{zone.location_name}</div>}
                {(zone.altitude_min_ft != null || zone.altitude_max_ft != null) && (
                  <div style={{ color: '#888', fontSize: '0.7rem' }}>
                    {zone.altitude_min_ft ?? 0} – {zone.altitude_max_ft ?? '∞'} ft
                  </div>
                )}
                {zone.effective_to && (
                  <div style={{ color: '#666', fontSize: '0.68rem' }}>
                    Until {new Date(zone.effective_to).toUTCString().slice(0, 22)}
                  </div>
                )}
              </div>
            </Tooltip>
          </GeoJSON>
        )
      })}
    </>
  )
}
