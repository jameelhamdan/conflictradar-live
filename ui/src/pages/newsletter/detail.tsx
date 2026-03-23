"use client"

import { useState, useEffect } from "react"
import { SiteHeader } from "@/components/layout"
import { NewsletterView } from "@/components/newsletter"
import { fetchNewsletter, fetchLatestNewsletter } from "../../api/newsletter"
import { useLanguage } from "../../contexts/LanguageContext"
import type { NewsletterDetail } from "../../api/newsletter"
import StatusDisplay from "@/components/StatusDisplay"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"

export default function NewsletterDatePage() {
  const { t } = useLanguage()
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useDocumentTitle(newsletter?.subject ?? t.newsletter)

  useEffect(() => {
    const parts = window.location.pathname.replace(/\/$/, "").split("/").filter(Boolean)
    const [, year, month, day] = parts
    const date = year && month && day ? `${year}-${month}-${day}` : null

    if (!date) {
      setError(t.invalidDateInUrl)
      setLoading(false)
      return
    }

    fetchNewsletter(date)
      .catch(() => fetchLatestNewsletter())
      .then(setNewsletter)
      .catch(() => setError(t.couldNotLoadNewsletter))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text-primary">
      <SiteHeader activePage="newsletter" />

      <main className="flex flex-1 flex-col min-h-0">
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <StatusDisplay status="loading" message={t.loading} />
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-1 items-center justify-center">
            <StatusDisplay status="error" message={error} />
          </div>
        )}
        {newsletter && !loading && (
          <div className="mx-auto w-full max-w-[760px] flex-1">
            <NewsletterView
              date={newsletter.date}
              initialData={newsletter}
              onBack={() => {
                window.location.href = "/newsletter"
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}
