"use client";

import { useState, useEffect } from 'react'

const NAV_LINK = { color: '#55556a', fontSize: '0.82rem', fontWeight: 500, textDecoration: 'none' } as const

export default function ConfirmClient() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = window.location.pathname.split('/').filter(Boolean).pop()
    if (!token) {
      setStatus('error')
      setMessage('Invalid confirmation link.')
      return
    }
    fetch(`/api/newsletter/confirm/${token}/`)
      .then(async res => {
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage(data.detail ?? 'Subscription confirmed!')
        } else {
          setStatus('error')
          setMessage(data.detail ?? 'This link is invalid or has already been used.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again later.')
      })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', color: '#e0e0e0' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: 44,
        background: '#13131c', borderBottom: '1px solid #222230',
      }}>
        <a href="/" style={NAV_LINK}>← Live map</a>
      </nav>

      <div style={{
        maxWidth: 480, margin: '0 auto',
        padding: '5rem 2rem', textAlign: 'center',
      }}>
        {status === 'loading' && (
          <p style={{ color: '#55556a', fontSize: '0.95rem' }}>Confirming your subscription…</p>
        )}
        {status === 'success' && (
          <>
            <div style={{
              fontSize: '2.5rem', marginBottom: '1.25rem', lineHeight: 1,
            }}>✓</div>
            <h1 style={{
              fontSize: '1.4rem', fontWeight: 700, color: '#e8e8f0',
              marginBottom: '0.75rem', letterSpacing: '-0.01em',
            }}>
              You're subscribed
            </h1>
            <p style={{ color: '#888899', fontSize: '0.92rem', lineHeight: 1.65, marginBottom: '2rem' }}>
              {message}
            </p>
            <a href="/" style={{
              display: 'inline-block',
              background: '#7c9ef822', border: '1px solid #7c9ef844',
              color: '#7c9ef8', borderRadius: 6,
              padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
            }}>
              Go to live map
            </a>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1.25rem', lineHeight: 1, color: '#e05252' }}>✕</div>
            <h1 style={{
              fontSize: '1.4rem', fontWeight: 700, color: '#e8e8f0',
              marginBottom: '0.75rem', letterSpacing: '-0.01em',
            }}>
              Confirmation failed
            </h1>
            <p style={{ color: '#888899', fontSize: '0.92rem', lineHeight: 1.65, marginBottom: '2rem' }}>
              {message}
            </p>
            <a href="/" style={{
              display: 'inline-block',
              background: '#16161f', border: '1px solid #2a2a3a',
              color: '#888899', borderRadius: 6,
              padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
            }}>
              Go to live map
            </a>
          </>
        )}
      </div>
    </div>
  )
}
