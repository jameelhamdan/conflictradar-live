'use client'

import { categoryColor, categoryIcon, intensityColor } from '../../constants'
import { useLanguage } from '../../contexts/LanguageContext'
import { UI } from '../../i18n/strings'
import { categoryLabel } from '../../i18n/categories'
import type { EventSummary } from '../../types'

/**
 * Pick a localized field from an object that carries `field` (en) and `field_ar` (ar).
 * Falls back to the base English field if the Arabic value is absent.
 */
export function useLocalizedField() {
  const { lang } = useLanguage()
  return (obj: Record<string, unknown>, field: string): string => {
    if (lang === 'ar') {
      const arVal = obj[`${field}_ar`]
      if (typeof arVal === 'string' && arVal) return arVal
    }
    return String(obj[field] ?? '')
  }
}

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

export function timeAgo(iso: string, lang: 'en' | 'ar' = 'en'): string {
  const t = UI[lang]
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return t.justNow
  if (mins < 60) return t.minutesAgo(mins)
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t.hoursAgo(hrs)
  return t.daysAgo(Math.floor(hrs / 24))
}

interface CategoryBadgeProps {
  category: string
  compact?: boolean
}

export function CategoryBadge({ category, compact = false }: CategoryBadgeProps) {
  const { lang } = useLanguage()
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
      {categoryLabel(lang, category)}
    </span>
  )
}

interface EventMetaProps {
  event: EventSummary
  compact?: boolean
  showLocation?: boolean
}

export function EventMeta({ event, compact = false, showLocation = true }: EventMetaProps) {
  const { t } = useLanguage()
  const pick = useLocalizedField()
  const locationName = pick(event as unknown as Record<string, unknown>, 'location_name')
  const fontSize = compact ? '0.7rem' : '0.77rem'
  return (
    <div style={{ display: 'flex', gap: '0.4rem', fontSize, color: '#888', flexWrap: 'wrap' }}>
      {showLocation && <span style={{ color: '#aaa' }}>📍 {locationName}</span>}
      {showLocation && <span style={{ color: '#444' }}>·</span>}
      <span>{t.articleCount(event.article_count)}</span>
      {event.avg_intensity != null && (
        <>
          <span style={{ color: '#444' }}>·</span>
          <IntensityBar value={event.avg_intensity} compact={compact} />
        </>
      )}
    </div>
  )
}
