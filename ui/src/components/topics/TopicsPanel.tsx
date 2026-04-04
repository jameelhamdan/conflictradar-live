"use client"

import { useState, useEffect } from "react"
import { fetchTopics } from "../../api/topics"
import { categoryColor } from "@/components/category"
import { cn } from "@/lib/utils"
import type { Topic } from "../../types"

interface TopicsPanelProps {
  activeTopic: string | null
  onTopicClick: (slug: string) => void
}

export default function TopicsPanel({ activeTopic, onTopicClick }: TopicsPanelProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetchTopics({ active: true, current: true, top_level: true })
      .then(setTopics)
      .catch(() => {})
  }, [])

  if (topics.length === 0) return null

  return (
    <div className="border-b border-app-border bg-app-surface">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between px-3 py-[0.4rem] text-left"
      >
        <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-app-text-muted">
          Active Topics
          <span className="ml-1.5 rounded-full bg-[#1e2540] px-1.5 py-[0.05rem] text-[0.65rem] text-[#7c9ef8]">
            {topics.length}
          </span>
        </span>
        <span className="text-[0.65rem] text-app-text-ghost">{collapsed ? "▸" : "▾"}</span>
      </button>

      {!collapsed && (
        <div className="flex flex-wrap gap-[0.3rem] px-3 pb-[0.5rem]">
          {topics.map((topic) => {
            const color = topic.category ? categoryColor(topic.category) : "#888899"
            const isActive = activeTopic === topic.slug
            return (
              <button
                key={topic.slug}
                onClick={() => onTopicClick(topic.slug)}
                title={topic.description ?? topic.name}
                className={cn(
                  "flex items-center gap-[0.3rem] rounded-full border px-[0.5rem] py-[0.15rem] text-[0.72rem] leading-[1.4] transition-colors duration-100",
                  isActive
                    ? "border-[#7c9ef8] bg-[#1e2540] text-[#e8e8f0]"
                    : "border-[#2a2a35] bg-transparent text-[#888899] hover:border-[#7c9ef8] hover:text-[#c8c8d8]",
                )}
              >
                <span
                  className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {topic.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
