'use client'

import { useState, useEffect } from 'react'

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined
const CONSENT_KEY = 'cr_cookie_consent'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function loadGA(id: string) {
  if (!id || document.querySelector(`script[data-ga="${id}"]`)) return
  window.dataLayer = window.dataLayer || []
  window.gtag = function (...args) { window.dataLayer.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', id)
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  s.dataset.ga = id
  document.head.appendChild(s)
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored === 'accepted' && GA_ID) {
      loadGA(GA_ID)
    } else if (!stored) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    if (GA_ID) loadGA(GA_ID)
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#13131c',
      borderTop: '1px solid #2a2a3a',
      padding: '0.9rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <p style={{ flex: 1, minWidth: 220, fontSize: '0.82rem', color: '#888899', lineHeight: 1.55, margin: 0 }}>
        We use cookies to analyse site traffic via Google Analytics.
        No personal data is collected without your consent.{' '}
        <a href="/privacy" style={{ color: '#7c9ef8', textDecoration: 'none' }}>Privacy policy</a>
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            fontSize: '0.78rem', fontWeight: 500,
            padding: '0.35rem 0.85rem', borderRadius: 6,
            border: '1px solid #2a2a3a', background: 'transparent',
            color: '#55556a', cursor: 'pointer',
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            fontSize: '0.78rem', fontWeight: 600,
            padding: '0.35rem 0.85rem', borderRadius: 6,
            border: '1px solid #7c9ef844', background: '#7c9ef81a',
            color: '#7c9ef8', cursor: 'pointer',
          }}
        >
          Accept cookies
        </button>
      </div>
    </div>
  )
}
