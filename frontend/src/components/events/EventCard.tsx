'use client'

import { useState } from 'react'
import { fetchEventDetail } from '../../api/events'
import { categoryColor } from '../../constants'
import { timeAgo, CategoryBadge, EventMeta } from './EventUI'
import type { EventSummary, Article } from '../../types'

interface EventCardProps {
  event: EventSummary
  selected: boolean
  onSelect: (id: string) => void
}

export default function EventCard({ event, selected, onSelect }: EventCardProps) {
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [loadingArticles, setLoadingArticles] = useState(false)

  const color = categoryColor(event.category)

  async function toggleArticles(e: React.MouseEvent) {
    e.stopPropagation()
    if (articles) { setArticles(null); return }
    setLoadingArticles(true)
    try {
      const detail = await fetchEventDetail(event.id)
      setArticles(detail.articles ?? [])
    } finally {
      setLoadingArticles(false)
    }
  }

  return (
    <div
      onClick={() => onSelect(event.id)}
      style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #2a2a3a',
        borderLeft: `3px solid ${color}`,
        background: selected ? '#1e1e2e' : '#16161f',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <CategoryBadge category={event.category} />
        <span style={{ fontSize: '0.75rem', color: '#666' }}>{timeAgo(event.started_at)}</span>
      </div>

      <div style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.35, marginBottom: '0.4rem', color: '#d8d8e8' }}>
        {event.title}
      </div>

      <div style={{ marginBottom: '0.4rem' }}>
        <EventMeta event={event} />
      </div>

      <button
        onClick={toggleArticles}
        style={{ background: 'none', border: 'none', color: '#5577cc', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
      >
        {loadingArticles ? 'Loading…' : articles ? 'Hide articles ▲' : 'Show articles ▼'}
      </button>

      {articles && (
        <ul style={{ listStyle: 'none', marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid #2a2a3a' }}>
          {articles.map(a => (
            <li key={a.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.5rem' }}>
              <a
                href={a.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#7c9ef8', textDecoration: 'none', fontSize: '0.82rem' }}
              >
                {a.title}
              </a>
              <span style={{ color: '#666', fontSize: '0.73rem' }}>
                {a.source_code} · {new Date(a.published_on).toLocaleString()}
              </span>
            </li>
          ))}
          {articles.length === 0 && (
            <li style={{ color: '#666', fontSize: '0.8rem' }}>No articles found.</li>
          )}
        </ul>
      )}
    </div>
  )
}
