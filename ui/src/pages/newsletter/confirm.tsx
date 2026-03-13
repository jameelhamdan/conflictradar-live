"use client"

import { useState, useEffect } from "react"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = window.location.pathname.split("/").filter(Boolean).pop()
    if (!token) {
      setStatus("error")
      setMessage("Invalid confirmation link.")
      return
    }
    fetch(`/api/newsletter/confirm/${token}/`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus("success")
          setMessage(data.detail ?? "Subscription confirmed!")
        } else {
          setStatus("error")
          setMessage(data.detail ?? "This link is invalid or has already been used.")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("Something went wrong. Please try again later.")
      })
  }, [])

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary">
      <nav className="simple-page-nav">
        <a href="/" className="text-[0.82rem] font-medium text-app-text-muted no-underline">
          ← Live map
        </a>
      </nav>

      <div className="simple-page-content">
        {status === "loading" && (
          <p className="text-[0.95rem] text-app-text-muted">Confirming your subscription…</p>
        )}
        {status === "success" && (
          <>
            <div className="mb-5 text-[2.5rem] leading-none">✓</div>
            <h1 className="mb-3 text-[1.4rem] font-bold tracking-[-0.01em] text-app-text-heading">
              You're subscribed
            </h1>
            <p className="mb-8 text-[0.92rem] leading-[1.65] text-app-text-secondary">
              {message}
            </p>
            <a href="/" className="simple-page-link-primary">
              Go to live map
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mb-5 text-[2rem] leading-none text-app-accent-red">✕</div>
            <h1 className="mb-3 text-[1.4rem] font-bold tracking-[-0.01em] text-app-text-heading">
              Confirmation failed
            </h1>
            <p className="mb-8 text-[0.92rem] leading-[1.65] text-app-text-secondary">
              {message}
            </p>
            <a href="/" className="simple-page-link-default">
              Go to live map
            </a>
          </>
        )}
      </div>
    </div>
  )
}
