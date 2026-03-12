'use client'

import { useState, useEffect } from "react"
import { fetchPricesLatest } from "../../api/streams"
import { useLanguage } from "../../contexts/LanguageContext"
import type { PriceTick, StreamKey } from "../../types"

const STREAM_KEYS: StreamKey[] = ["stock", "crypto", "commodity", "forex", "bond"]

function changeColor(pct: number | null): string {
  if (pct == null) return "#55556a"
  return pct >= 0 ? "#52c8a0" : "#e05252"
}

function formatValue(value: number, streamKey: StreamKey): string {
  if (streamKey === "forex") return value.toFixed(4)
  if (value >= 1000)
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (value >= 1) return value.toFixed(2)
  return value.toFixed(4)
}

interface PriceRowProps {
  tick: PriceTick
  flash: boolean
}

function PriceRow({ tick, flash }: PriceRowProps) {
  const color = changeColor(tick.change_pct)
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0.28rem 0.75rem",
        borderBottom: "1px solid #1a1a26",
        background: flash ? "#1e2a1e44" : "transparent",
        transition: "background 0.4s",
        gap: "0.5rem",
      }}
    >
      <span
        style={{
          flex: "0 0 72px",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "#c8c8d8",
          letterSpacing: "0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {tick.symbol}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: "0.68rem",
          color: "#55556a",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {tick.name}
      </span>
      <span
        style={{
          flex: "0 0 80px",
          textAlign: "right",
          fontSize: "0.76rem",
          fontWeight: 600,
          color: "#e0e0ec",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatValue(tick.value, tick.stream_key)}
      </span>
      <span
        style={{
          flex: "0 0 56px",
          textAlign: "right",
          fontSize: "0.7rem",
          fontWeight: 500,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {tick.change_pct != null
          ? `${tick.change_pct >= 0 ? "+" : ""}${tick.change_pct.toFixed(2)}%`
          : "—"}
      </span>
    </div>
  )
}

interface PriceTickerProps {
  latestTick: {
    symbol: string
    value: number
    change_pct: number | null
    occurred_at: string
  } | null
}

export default function PriceTicker({ latestTick }: PriceTickerProps) {
  const { t } = useLanguage()
  const [activeKey, setActiveKey] = useState<StreamKey>("crypto")
  const [ticks, setTicks] = useState<PriceTick[]>([])
  const [loading, setLoading] = useState(true)
  const [flashedSymbols, setFlashedSymbols] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    fetchPricesLatest(activeKey)
      .then((data) => setTicks(data.results))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeKey])

  useEffect(() => {
    if (!latestTick) return
    setTicks((prev) =>
      prev.map((tk) =>
        tk.symbol === latestTick.symbol
          ? {
              ...tk,
              value: latestTick.value,
              change_pct: latestTick.change_pct,
              occurred_at: latestTick.occurred_at,
            }
          : tk,
      ),
    )
    setFlashedSymbols((prev) => new Set([...prev, latestTick.symbol]))
    const timer = setTimeout(() => {
      setFlashedSymbols((prev) => {
        const next = new Set(prev)
        next.delete(latestTick.symbol)
        return next
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [latestTick])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderBottom: "1px solid #1e1e2a",
      }}
    >
      <div
        style={{
          padding: "0.5rem 0.75rem 0",
          borderBottom: "1px solid #1a1a26",
        }}
      >
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            color: "#44445a",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "0.35rem",
          }}
        >
          {t.markets}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.2rem",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {STREAM_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setActiveKey(key)}
              style={{
                fontSize: "0.68rem",
                fontWeight: activeKey === key ? 600 : 400,
                padding: "0.18rem 0.5rem",
                borderRadius: 99,
                border: `1px solid ${
                  activeKey === key ? "#7c9ef855" : "transparent"
                }`,
                background: activeKey === key ? "#7c9ef81a" : "transparent",
                color: activeKey === key ? "#7c9ef8" : "#44445a",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.streamKeys[key]}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          padding: "0.22rem 0.75rem",
          gap: "0.5rem",
          borderBottom: "1px solid #18182a",
        }}
      >
        <span
          style={{
            flex: "0 0 72px",
            fontSize: "0.62rem",
            color: "#33334a",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {t.symbolCol}
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            flex: "0 0 80px",
            textAlign: "right",
            fontSize: "0.62rem",
            color: "#33334a",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {t.priceCol}
        </span>
        <span
          style={{
            flex: "0 0 56px",
            textAlign: "right",
            fontSize: "0.62rem",
            color: "#33334a",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {t.changeCol}
        </span>
      </div>

      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {loading ? (
          <div
            style={{
              padding: "0.75rem",
              fontSize: "0.72rem",
              color: "#33334a",
              minHeight: 200,
            }}
          >
            {t.loading}
          </div>
        ) : ticks.length === 0 ? (
          <div
            style={{
              padding: "0.75rem",
              fontSize: "0.72rem",
              color: "#33334a",
            }}
          >
            {t.noDataYet}
          </div>
        ) : (
          ticks.map((tk) => (
            <PriceRow
              key={tk.id}
              tick={tk}
              flash={flashedSymbols.has(tk.symbol)}
            />
          ))
        )}
      </div>
    </div>
  )
}

