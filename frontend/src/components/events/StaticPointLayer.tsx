'use client'

import { useEffect, useState } from 'react'
import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import { fetchStaticPoints } from '../../api/streams'
import type { StaticPoint, StaticPointType } from '../../types'

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

const ALL_TYPES: StaticPointType[] = ['exchange', 'commodity_exchange', 'port', 'central_bank']

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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.7rem', lineHeight: 1.5 }}>
      <span style={{ color: '#888899', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#c8c8d8', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function StaticPointPopup({ point }: { point: StaticPoint }) {
  const type = point.point_type as StaticPointType
  const color = POINT_TYPE_COLOR[type]
  const symbol = POINT_TYPE_SYMBOL[type]
  const label = POINT_TYPE_LABEL[type]
  const flag = countryFlag(point.country_code)
  const m = point.metadata as Record<string, unknown>

  return (
    <div style={{ fontFamily: 'inherit', minWidth: 200, maxWidth: 260 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 4, flexShrink: 0,
          background: color + '22', border: `1.5px solid ${color}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color, lineHeight: 1,
        }}>{symbol}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#e8e8f0', fontSize: '0.82rem', lineHeight: 1.25, marginBottom: 2 }}>
            {point.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.68rem', color: '#888899' }}>{flag} {point.country}</span>
            <span style={{
              fontSize: '0.62rem', padding: '0px 5px', borderRadius: 3,
              background: color + '22', color, border: `1px solid ${color}55`,
              fontWeight: 600, letterSpacing: '0.02em',
            }}>{point.code}</span>
          </div>
        </div>
      </div>

      {/* Type badge */}
      <div style={{
        display: 'inline-block', fontSize: '0.63rem', padding: '2px 7px', borderRadius: 3,
        background: '#2a2a35', color: '#888899', marginBottom: 10,
      }}>{label}</div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #2a2a35', marginBottom: 8 }} />

      {/* Type-specific metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {((type === 'exchange' || type === 'central_bank') && m.timezone) ? (
          <MetaRow label="Timezone" value={String(m.timezone)} />
        ) : null}
        {(type === 'central_bank' && m.currency) ? (
          <MetaRow label="Currency" value={String(m.currency)} />
        ) : null}
        {((type === 'exchange' || type === 'central_bank') && m.website) ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.7rem', lineHeight: 1.5 }}>
            <span style={{ color: '#888899' }}>Website</span>
            <a
              href={`https://${String(m.website) as string}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >{String(m.website) as string}</a>
          </div>
        ) : null}
        {(type === 'commodity_exchange' && Array.isArray(m.products)) ? (
          <div>
            <div style={{ fontSize: '0.68rem', color: '#888899', marginBottom: 4 }}>Products</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(m.products as string[]).map(p => (
                <span key={p} style={{
                  fontSize: '0.63rem', padding: '1px 6px', borderRadius: 3,
                  background: color + '18', color, border: `1px solid ${color}44`,
                }}>{p}</span>
              ))}
            </div>
          </div>
        ) : null}
        {type === 'port' ? (
          <>
            {m.type ? <MetaRow label="Port type" value={String(m.type)} /> : null}
            {m.teu_rank ? <MetaRow label="TEU rank" value={`#${m.teu_rank} globally`} /> : null}
            {m.note ? (
              <div style={{ fontSize: '0.68rem', color: '#888899', fontStyle: 'italic', marginTop: 2 }}>
                {String(m.note)}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

interface StaticPointLayerProps {
  visibleTypes?: StaticPointType[]
}

export default function StaticPointLayer({ visibleTypes = ALL_TYPES }: StaticPointLayerProps) {
  const [points, setPoints] = useState<StaticPoint[]>([])

  useEffect(() => {
    fetchStaticPoints()
      .then(data => setPoints(data.results))
      .catch(() => {})
  }, [])

  const filtered = points.filter(p => visibleTypes.includes(p.point_type as StaticPointType))

  return (
    <>
      {filtered.map(point => (
        <Marker key={point.code} position={[point.latitude, point.longitude]} icon={makeStaticIcon(point.point_type as StaticPointType)}>
          <Popup closeButton={false}>
            <StaticPointPopup point={point} />
          </Popup>
        </Marker>
      ))}
    </>
  )
}
