'use client'

import { useRef, useEffect } from "react"
import EventCard from "./EventCard"
import StatusDisplay from "../StatusDisplay"
import type { EventSummary } from "../../types"
import { useLanguage } from "../../contexts/LanguageContext"

interface EventListProps {
  events: EventSummary[]
  selectedId: string | null
  onSelectEvent: (id: string) => void
  onTopicClick?: (slug: string) => void
  activeTopic?: string | null
}

export default function EventList({ events, selectedId, onSelectEvent, onTopicClick, activeTopic }: EventListProps) {
  const { t } = useLanguage()
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (selectedId && cardRefs.current[selectedId]) {
      cardRefs.current[selectedId]!.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [selectedId])

  if (events.length === 0) {
    return <StatusDisplay status="empty" message={t.noEventsFiltered} />
  }

  return (
    <div className="flex flex-col">
      {events.map((ev) => (
        <div
          key={ev.id}
          ref={(el) => {
            cardRefs.current[ev.id] = el
          }}
        >
          <EventCard event={ev} selected={selectedId === ev.id} onSelect={onSelectEvent} onTopicClick={onTopicClick} activeTopic={activeTopic} />
        </div>
      ))}
    </div>
  )
}
