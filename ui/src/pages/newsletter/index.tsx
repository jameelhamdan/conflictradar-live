"use client"

import { useState, useEffect } from "react"
import { fetchLatestNewsletter } from "../../api/newsletter"
import { useLanguage } from "../../contexts/LanguageContext"
import type { NewsletterDetail } from "../../api/newsletter"
import { SiteHeader } from "@/components/layout"
import { NewsletterList, NewsletterView } from "@/components/newsletter"

export default function NewsletterPage() {
  const { t } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [latestData, setLatestData] = useState<NewsletterDetail | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    fetchLatestNewsletter()
      .then((data) => {
        setLatestData(data)
        setSelectedDate(data.date)
      })
      .catch(() => { /* no newsletters yet */ })
  }, [])

  // On mobile: show list pane or detail pane, never both
  const showList = !isMobile || !selectedDate
  const showDetail = !isMobile || !!selectedDate

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text-primary">
      <title>Daily Briefing — conflictradar.live</title>
      <meta
        name="description"
        content="Daily AI-written geopolitical briefing from conflictradar.live, summarising the most important global events."
      />
      <link rel="canonical" href="https://conflictradar.live/newsletter" />

      <SiteHeader activePage="newsletter" />

      <main className="flex flex-1 min-h-0 border-t border-app-border-mid">
        {/* List pane */}
        {showList && (
          <section className={`flex flex-col border-r border-app-border bg-app-panel min-h-0 ${isMobile ? "w-full" : "w-[320px] shrink-0"}`}>
            <div className="shrink-0 border-b border-app-border px-4 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-app-text-secondary">
              {t.pastBriefings}
            </div>
            <div className="flex-1 overflow-y-auto">
              <NewsletterList
                onSelect={(date) => {
                  setSelectedDate(date)
                  setLatestData(null)
                }}
              />
            </div>
          </section>
        )}

        {/* Detail pane */}
        {showDetail && (
          <section className="flex flex-1 min-w-0 flex-col bg-app-panel">
            {isMobile && selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="shrink-0 border-b border-app-border px-4 py-3 text-left text-[0.8rem] text-app-text-muted"
              >
                ← {t.pastBriefings}
              </button>
            )}
            <div className="flex-1 min-h-0">
              {selectedDate ? (
                <NewsletterView date={selectedDate} initialData={latestData ?? undefined} />
              ) : (
                <div className="flex h-full items-center justify-center text-[0.9rem] text-app-text-dim">
                  {t.selectBriefing}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
