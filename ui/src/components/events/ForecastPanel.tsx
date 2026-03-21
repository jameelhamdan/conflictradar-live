"use client"

import { useEffect, useState } from "react"
import { fetchForecasts } from "@/api/streams"
import type { Forecast } from "@/types"

const DIRECTION_ICON: Record<string, string> = {
  up:      "▲",
  down:    "▼",
  neutral: "●",
}

const DIRECTION_COLOR: Record<string, string> = {
  up:      "#52c8a0",
  down:    "#e05252",
  neutral: "#888899",
}

const STREAM_KEY_LABELS: Record<string, string> = {
  commodity: "Commodities",
  crypto:    "Crypto",
  stock:     "Stocks",
  forex:     "Forex",
  bond:      "Bonds",
}

// Confidence bar — simple SVG strip
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <svg width={40} height={6} style={{ borderRadius: 3, overflow: "hidden" }}>
        <rect x={0} y={0} width={40} height={6} fill="#2a2a35" />
        <rect x={0} y={0} width={40 * value} height={6} fill="#7c9ef8" rx={3} />
      </svg>
      <span style={{ fontSize: "0.65rem", color: "#888899" }}>{pct}%</span>
    </span>
  )
}

interface ForecastRowProps {
  fc: Forecast
  selected: boolean
  onClick: () => void
}

function ForecastRow({ fc, selected, onClick }: ForecastRowProps) {
  const color = DIRECTION_COLOR[fc.direction] ?? "#888899"
  const icon  = DIRECTION_ICON[fc.direction]  ?? "●"
  return (
    <button
      onClick={onClick}
      style={{
        display:         "flex",
        alignItems:      "center",
        gap:             8,
        padding:         "6px 12px",
        background:      selected ? "#1e2030" : "transparent",
        border:          "none",
        borderBottom:    "1px solid #2a2a35",
        cursor:          "pointer",
        width:           "100%",
        textAlign:       "left",
      }}
    >
      <span style={{ fontSize: "0.8rem", color, minWidth: 14 }}>{icon}</span>
      <span style={{ fontSize: "0.8rem", color: "#e8e8f0", flex: 1, fontFamily: "monospace" }}>
        {fc.symbol}
      </span>
      <ConfidenceBar value={fc.confidence} />
    </button>
  )
}

function ReasoningPanel({ fc }: { fc: Forecast }) {
  const fv = fc.feature_vector as Record<string, unknown>
  const sentiment = typeof fv.news_sentiment_mean === "number"
    ? fv.news_sentiment_mean.toFixed(3)
    : "N/A"
  const momentum1h = typeof fv.price_momentum_1h === "number"
    ? (fv.price_momentum_1h * 100).toFixed(2) + "%"
    : "N/A"
  const routedCount = typeof fv.routed_event_count === "number"
    ? fv.routed_event_count
    : "N/A"

  const generated = new Date(fc.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div
      style={{
        padding:    "10px 12px",
        background: "#14141a",
        borderBottom: "1px solid #2a2a35",
        fontSize:   "0.75rem",
        color:      "#888899",
      }}
    >
      <div style={{ color: "#e8e8f0", marginBottom: 4, fontSize: "0.8rem" }}>
        <span style={{ color: DIRECTION_COLOR[fc.direction] }}>
          {DIRECTION_ICON[fc.direction]} {fc.direction.toUpperCase()}
        </span>
        {" · "}
        {fc.symbol}
        {" · "}
        {fc.horizon_hours}h horizon
        {" · "}
        <span style={{ color: "#444458" }}>{generated}</span>
      </div>
      {fc.reasoning && (
        <div style={{ marginBottom: 6, color: "#aaaacc", fontStyle: "italic" }}>
          "{fc.reasoning}"
        </div>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <span>Sentiment: <span style={{ color: "#e8e8f0" }}>{sentiment}</span></span>
        <span>1h Δ: <span style={{ color: "#e8e8f0" }}>{momentum1h}</span></span>
        <span>Related events: <span style={{ color: "#e8e8f0" }}>{routedCount}</span></span>
        {fc.actual_value !== null && (
          <span>
            Actual: <span style={{ color: "#52c8a0" }}>{fc.actual_value?.toFixed(2)}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default function ForecastPanel() {
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [selected, setSelected]   = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchForecasts()
        if (!cancelled) {
          setForecasts(data.results)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  if (loading) return null
  if (forecasts.length === 0) return null

  // Group by stream_key
  const grouped: Record<string, Forecast[]> = {}
  for (const fc of forecasts) {
    if (!grouped[fc.stream_key]) grouped[fc.stream_key] = []
    grouped[fc.stream_key].push(fc)
  }

  return (
    <div
      style={{
        borderBottom: "1px solid #2a2a35",
        background:   "#0f0f13",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         6,
          width:       "100%",
          padding:     "6px 12px",
          background:  "transparent",
          border:      "none",
          borderBottom: expanded ? "1px solid #2a2a35" : "none",
          cursor:      "pointer",
          color:       "#888899",
          fontSize:    "0.7rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <span>⬡</span>
        <span style={{ flex: 1, textAlign: "left" }}>Market Forecasts</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <>
          {Object.entries(grouped).map(([key, fcs]) => (
            <div key={key}>
              <div
                style={{
                  padding:       "3px 12px",
                  fontSize:      "0.65rem",
                  color:         "#444458",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background:    "#0f0f13",
                }}
              >
                {STREAM_KEY_LABELS[key] ?? key}
              </div>
              {fcs.map((fc) => (
                <div key={fc.id}>
                  <ForecastRow
                    fc={fc}
                    selected={selected === fc.id}
                    onClick={() => setSelected((prev) => (prev === fc.id ? null : fc.id))}
                  />
                  {selected === fc.id && <ReasoningPanel fc={fc} />}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
