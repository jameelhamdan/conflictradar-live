import type { Topic, TopicsResponse } from "../types"
import constants from "@/constants"

const BASE = `${constants.BASE_URL}/api`

export async function fetchTopics(params: {
  active?: boolean
  current?: boolean
  top_level?: boolean
  category?: string
} = {}): Promise<Topic[]> {
  const p = new URLSearchParams()
  if (params.active !== undefined) p.set("active", params.active ? "true" : "false")
  if (params.current !== undefined) p.set("current", params.current ? "true" : "false")
  if (params.top_level !== undefined) p.set("top_level", params.top_level ? "true" : "false")
  if (params.category) p.set("category", params.category)

  const res = await fetch(`${BASE}/topics/?${p}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json() as TopicsResponse
  return data.results
}

export async function fetchTopicDetail(slug: string): Promise<Topic> {
  const res = await fetch(`${BASE}/topics/${slug}/`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<Topic>
}
