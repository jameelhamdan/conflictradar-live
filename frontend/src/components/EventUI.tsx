'use client'

import { categoryColor, categoryIcon, intensityColor } from '../constants'
import type { EventSummary } from '../types'

function IntensityBar({ value, compact }: { value: number; compact: boolean }) {
  const color = intensityColor(value)
  const filled = Math.round(value * 5)
  const size = compact ? 5 : 6
  const gap = compact ? 2 : 2
  return (
    <span
      title={`${(value * 100).toFixed(0)}% intensity`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: `${gap}px` }}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: size,
            height: compact ? size + 2 : size + 3,
            borderRadius: 1,
            background: i < filled ? color : color + '28',
          }}
        />
      ))}
    </span>
  )
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface CategoryBadgeProps {
  category: string
  compact?: boolean
}

export function CategoryBadge({ category, compact = false }: CategoryBadgeProps) {
  const color = categoryColor(category)
  const Icon = categoryIcon(category)
  const iconSize = compact ? 8 : 10
  const fontSize = compact ? '0.65rem' : '0.7rem'
  const padding = compact ? '0.1rem 0.35rem' : '0.15rem 0.45rem'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: compact ? '0.22rem' : '0.3rem',
      fontSize, fontWeight: 600, padding, borderRadius: 99,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: color + '33', color,
    }}>
      <Icon size={iconSize} color={color} />
      {category}
    </span>
  )
}

interface EventMetaProps {
  event: EventSummary
  compact?: boolean
  showLocation?: boolean
}

export function EventMeta({ event, compact = false, showLocation = true }: EventMetaProps) {
  const fontSize = compact ? '0.7rem' : '0.77rem'
  return (
    <div style={{ display: 'flex', gap: '0.4rem', fontSize, color: '#888', flexWrap: 'wrap' }}>
      {showLocation && <span style={{ color: '#aaa' }}>📍 {event.location_name}</span>}
      {showLocation && <span style={{ color: '#444' }}>·</span>}
      <span>{event.article_count} article{event.article_count !== 1 ? 's' : ''}</span>
      {event.avg_intensity != null && (
        <>
          <span style={{ color: '#444' }}>·</span>
          <IntensityBar value={event.avg_intensity} compact={compact} />
        </>
      )}
    </div>
  )
}
