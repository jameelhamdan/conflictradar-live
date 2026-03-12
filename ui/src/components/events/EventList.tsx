'use client'

import { useRef, useEffect } from "react"
import EventCard from "./EventCard"
import type { EventSummary } from "../../types"

interface EventListProps {
  events: EventSummary[]
  selectedId: string | null
  onSelectEvent: (id: string) => void
}

export default function EventList({
  events,
  selectedId,
  onSelectEvent,
}: EventListProps) {
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
    return (
      <div
        style={{
          padding: "2rem 1rem",
          color: "#555",
          fontSize: "0.85rem",
          textAlign: "center",
        }}
      >
        No events match the current filters.
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {events.map((ev) => (
        <div
          key={ev.id}
          ref={(el) => {
            cardRefs.current[ev.id] = el
          }}
        >
          <EventCard
            event={ev}
            selected={selectedId === ev.id}
            onSelect={onSelectEvent}
          />
        </div>
      ))}
    </div>
  )
}

