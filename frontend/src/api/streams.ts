import type {
  PricesLatestResponse,
  NotamZonesResponse,
  EarthquakesResponse,
  StaticPointsResponse,
  StreamKey,
  StaticPointType,
} from '../types'

const BASE = '/api'

export async function fetchPricesLatest(stream_key?: StreamKey): Promise<PricesLatestResponse> {
  const params = new URLSearchParams()
  if (stream_key) params.set('stream_key', stream_key)
  const res = await fetch(`${BASE}/prices/latest/?${params}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function fetchNotamZones(active = true): Promise<NotamZonesResponse> {
  const params = new URLSearchParams({ active: active ? 'true' : 'all' })
  const res = await fetch(`${BASE}/notams/?${params}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function fetchEarthquakes(min_magnitude = 3.0, hours = 24): Promise<EarthquakesResponse> {
  const params = new URLSearchParams({
    min_magnitude: String(min_magnitude),
    hours: String(hours),
  })
  const res = await fetch(`${BASE}/earthquakes/?${params}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function fetchStaticPoints(type?: StaticPointType): Promise<StaticPointsResponse> {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  const res = await fetch(`${BASE}/static-points/?${params}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
