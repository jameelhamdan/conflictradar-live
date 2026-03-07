import type { EventsResponse, EventDetail, EventFilters } from '../types'

const BASE = '/api'

let _backendVersion: string | null = null
export function getBackendVersion(): string | null { return _backendVersion }

export async function fetchEvents(filters: EventFilters = {}): Promise<EventsResponse> {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.start) params.set('start', filters.start)
  if (filters.end) params.set('end', filters.end)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.bbox) params.set('bbox', filters.bbox)

  const res = await fetch(`${BASE}/events/?${params}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  _backendVersion = res.headers.get('X-App-Version')
  return res.json() as Promise<EventsResponse>
}

export async function fetchEventDetail(id: string): Promise<EventDetail> {
  const res = await fetch(`${BASE}/events/${id}/`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<EventDetail>
}
