import { useEffect, useRef, useCallback } from 'react'
import type { SSEEvent } from '../types'

type SSEHandler = (event: SSEEvent) => void

/**
 * Opens an EventSource connection to /api/sse/ and calls the handler
 * for each incoming message. Reconnects automatically on error.
 */
export function useSSE(onEvent: SSEHandler) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closed = false

    function connect() {
      if (closed) return
      es = new EventSource('/api/sse/')

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as SSEEvent
          handlerRef.current(data)
        } catch {
          // ignore malformed messages
        }
      }

      es.onerror = () => {
        es?.close()
        if (!closed) {
          reconnectTimer = setTimeout(connect, 5000)
        }
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      es?.close()
    }
  }, [])
}
