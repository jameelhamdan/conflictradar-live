"use client"

import { useState, useEffect } from "react"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { useLanguage } from "../../contexts/LanguageContext"

export default function ConfirmPage() {
  const { t } = useLanguage()
  useDocumentTitle(t.confirmSubscriptionTitle)
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = window.location.pathname.split("/").filter(Boolean).pop()
    if (!token) {
      setStatus("error")
      setMessage(t.invalidConfirmLink)
      return
    }
    fetch(`/api/newsletter/confirm/${token}/`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus("success")
          setMessage(data.detail ?? t.subscriptionConfirmed)
        } else {
          setStatus("error")
          setMessage(data.detail ?? t.invalidConfirmLink)
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage(t.somethingWentWrong)
      })
  }, [])

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary">
      <nav className="simple-page-nav">
        <a href="/" className="text-[0.82rem] font-medium text-app-text-muted no-underline">
          {t.backToLiveMap}
        </a>
      </nav>

      <div className="simple-page-content">
        {status === "loading" && (
          <p className="text-[0.95rem] text-app-text-muted">{t.confirmingSubscription}</p>
        )}
        {status === "success" && (
          <>
            <div className="mb-5 text-[2.5rem] leading-none">✓</div>
            <h1 className="mb-3 text-[1.4rem] font-bold tracking-[-0.01em] text-app-text-heading">
              {t.youreSubscribed}
            </h1>
            <p className="mb-8 text-[0.92rem] leading-[1.65] text-app-text-secondary">
              {message}
            </p>
            <a href="/" className="simple-page-link-primary">
              {t.goToLiveMap}
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mb-5 text-[2rem] leading-none text-app-accent-red">✕</div>
            <h1 className="mb-3 text-[1.4rem] font-bold tracking-[-0.01em] text-app-text-heading">
              {t.confirmationFailed}
            </h1>
            <p className="mb-8 text-[0.92rem] leading-[1.65] text-app-text-secondary">
              {message}
            </p>
            <a href="/" className="simple-page-link-default">
              {t.goToLiveMap}
            </a>
          </>
        )}
      </div>
    </div>
  )
}
