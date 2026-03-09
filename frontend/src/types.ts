export type Category =
  | 'conflict'
  | 'protest'
  | 'disaster'
  | 'political'
  | 'economic'
  | 'crime'
  | 'general'

export interface EventSummary {
  id: string
  latitude: number | null
  longitude: number | null
  category: Category
  sub_categories: string[]
  avg_intensity: number | null
  title: string
  title_ar: string
  location_name: string
  location_name_ar: string
  article_count: number
  started_at: string
}

export interface Article {
  id: string
  title: string
  title_ar: string
  source_url: string
  source_code: string
  published_on: string
}

export interface EventDetail extends EventSummary {
  articles: Article[]
}

export interface EventFilters {
  category?: string
  start?: string
  end?: string
  limit?: number
  bbox?: string
}

export interface EventsResponse {
  results: EventSummary[]
  count: number
}

// --- Stream types ---

export type StreamKey = 'stock' | 'crypto' | 'commodity' | 'forex' | 'bond'

export interface PriceTick {
  id: string
  symbol: string
  stream_key: StreamKey
  name: string
  value: number
  change_pct: number | null
  volume: number | null
  occurred_at: string
}

export interface PricesLatestResponse {
  results: PriceTick[]
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: { type: string; coordinates: unknown } | null
  properties: Record<string, unknown>
}

export interface NotamZone {
  id: string
  notam_id: string
  notam_type: string
  geometry: GeoJSONFeature
  is_active: boolean
  effective_from: string
  effective_to: string | null
  altitude_min_ft: number | null
  altitude_max_ft: number | null
  location_name: string
  country_code: string
  updated_at: string
}

export interface NotamZonesResponse {
  results: NotamZone[]
  count: number
}

export interface EarthquakeRecord {
  id: string
  usgs_id: string
  magnitude: number
  magnitude_type: string
  depth_km: number | null
  location_name: string
  latitude: number
  longitude: number
  occurred_at: string
  tsunami_alert: boolean
  alert_level: string
}

export interface EarthquakesResponse {
  results: EarthquakeRecord[]
  count: number
}

export type StaticPointType = 'exchange' | 'commodity_exchange' | 'port' | 'central_bank'

export interface StaticPoint {
  id: string
  code: string
  point_type: StaticPointType
  name: string
  country: string
  country_code: string
  latitude: number
  longitude: number
  metadata: Record<string, unknown>
  is_active: boolean
}

export interface StaticPointsResponse {
  results: StaticPoint[]
  count: number
}

// --- Newsletter types ---

export interface NewsletterSummary {
  id: string
  date: string
  subject: string
  sent_at: string | null
  event_count: number
  status: string
}

export interface NewsletterDetail extends NewsletterSummary {
  html_body: string
  text_body: string
  generated_at: string
  sent_count: number
}

// SSE event payloads
export type SSEEvent =
  | { type: 'connected' }
  | { type: 'price_tick'; symbol: string; stream_key: StreamKey; name: string; value: number; change_pct: number | null; occurred_at: string }
  | { type: 'notam_update'; active_count: number; new_count: number }
  | { type: 'earthquake_update'; new_count: number; max_magnitude: number }
  | { type: string; [key: string]: unknown }
