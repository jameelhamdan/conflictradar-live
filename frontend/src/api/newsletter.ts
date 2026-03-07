const BASE = '/api/newsletter'

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

export interface NewslettersResponse {
  results: NewsletterSummary[]
  count: number
}

export async function fetchNewsletters(): Promise<NewslettersResponse> {
  const res = await fetch(`${BASE}/`)
  if (!res.ok) throw new Error(`Failed to fetch newsletters: ${res.status}`)
  return res.json()
}

export async function fetchNewsletter(date: string): Promise<NewsletterDetail> {
  const res = await fetch(`${BASE}/${date}/`)
  if (!res.ok) throw new Error(`Newsletter not found: ${res.status}`)
  return res.json()
}

export async function subscribeToNewsletter(email: string): Promise<{ detail: string }> {
  const res = await fetch(`${BASE}/subscribe/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json()
  if (!res.ok) {
    const msg = data?.email?.[0] ?? data?.detail ?? 'Subscription failed.'
    throw new Error(msg)
  }
  return data
}
