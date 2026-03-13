"use client"

import { useState } from "react"
import { fetchEventDetail } from "../../api/events"
import { categoryColor } from "@/components/category"
import { timeAgo, CategoryBadge, EventMeta, useLocalizedField } from "./EventUI"
import { useLanguage } from "../../contexts/LanguageContext"
import { subCategoryLabel } from "../../i18n/categories"
import type { EventSummary, Article } from "../../types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EventCardProps {
  event: EventSummary
  selected: boolean
  onSelect: (id: string) => void
}

export default function EventCard({ event, selected, onSelect }: EventCardProps) {
  const { lang, t } = useLanguage()
  const pick = useLocalizedField()
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [loadingArticles, setLoadingArticles] = useState(false)

  const color = categoryColor(event.category)
  const sourceNameMap = Object.fromEntries(
    (event.source_codes ?? []).map((code, i) => [code, event.source_names?.[i] ?? code])
  )

  async function toggleArticles(e: React.MouseEvent) {
    e.stopPropagation()
    if (articles) {
      setArticles(null)
      return
    }
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
      className={cn("event-card", selected ? "bg-app-card-selected" : "bg-app-card")}
      style={{ "--cat-color": color } as React.CSSProperties}
    >
      <div className="mb-[0.35rem] flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-[0.35rem]">
          <CategoryBadge category={event.category} />
          {event.sub_categories?.map((sub) => (
            <span key={sub} className="sub-cat-tag">
              {subCategoryLabel(lang, sub)}
            </span>
          ))}
        </div>
        <span className="text-[0.75rem] text-app-text-ghost">
          {timeAgo(event.started_at, lang)}
        </span>
      </div>

      <div className="mb-[0.4rem] text-[0.9rem] font-medium leading-[1.35] text-app-text-body">
        {pick(event as unknown as Record<string, unknown>, "title")}
      </div>

      <div className="mb-[0.4rem]">
        <EventMeta event={event} />
      </div>

      <Button
        onClick={toggleArticles}
        variant="link"
        className="h-auto p-0 text-[0.75rem] text-app-accent-blue"
      >
        {loadingArticles ? t.loading : articles ? t.hideArticles : t.showArticles}
      </Button>

      {articles && (
        <ul className="mt-2 list-none border-l-2 border-app-border-subtle pl-2">
          {articles.map((a) => (
            <li key={a.id} className="mb-2 flex flex-col">
              <a
                href={a.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.82rem] text-app-accent-blue no-underline"
              >
                {pick(a as unknown as Record<string, unknown>, "title")}
              </a>
              <span className="text-[0.73rem] text-app-text-ghost">
                {sourceNameMap[a.source_code] ?? a.source_code} · {new Date(a.published_on).toLocaleString()}
              </span>
            </li>
          ))}
          {articles.length === 0 && (
            <li className="text-[0.8rem] text-app-text-ghost">{t.noEvents}</li>
          )}
        </ul>
      )}
    </div>
  )
}
