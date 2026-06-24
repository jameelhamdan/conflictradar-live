'use client'

import { useEffect, useMemo, useState } from "react"
import { fetchSymbols } from "../../api/streams"
import { useLanguage } from "../../contexts/LanguageContext"
import type { MarketSymbol, StreamKey, SymbolGroup } from "../../types"
import type { UIStrings } from "../../i18n/strings"

interface SymbolBrowserProps {
  onSelect: (symbol: string, streamKey: StreamKey, name: string) => void
  selectedSymbol?: string | null
}

// Display order of groups + their i18n label key.
const GROUP_ORDER: { group: SymbolGroup; key: keyof UIStrings }[] = [
  { group: "top_stock", key: "groupTopStock" },
  { group: "top_crypto", key: "groupTopCrypto" },
  { group: "resource", key: "groupResource" },
  { group: "index", key: "groupIndex" },
  { group: "forex", key: "groupForex" },
  { group: "bond", key: "groupBond" },
  { group: "other", key: "groupOther" },
]

// Lists every tracked MarketSymbol grouped by class; clicking one drives the
// shared SymbolDetail chart (which already does PriceTick/PriceBar fallback).
export default function SymbolBrowser({ onSelect, selectedSymbol }: SymbolBrowserProps) {
  const { t } = useLanguage()
  const [symbols, setSymbols] = useState<MarketSymbol[]>([])

  useEffect(() => {
    let cancelled = false
    fetchSymbols()
      .then((d) => { if (!cancelled) setSymbols(d.results) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const grouped = useMemo(() => {
    const byGroup = new Map<SymbolGroup, MarketSymbol[]>()
    for (const s of symbols) {
      const list = byGroup.get(s.group) ?? []
      list.push(s)
      byGroup.set(s.group, list)
    }
    for (const list of byGroup.values()) {
      list.sort((a, b) => a.display_order - b.display_order || a.symbol.localeCompare(b.symbol))
    }
    return byGroup
  }, [symbols])

  if (symbols.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.7rem] leading-snug text-app-text-muted">{t.symbolBrowserNote}</p>
      {GROUP_ORDER.map(({ group, key }) => {
        const list = grouped.get(group)
        if (!list || list.length === 0) return null
        return (
          <div key={group} className="flex flex-col gap-1.5">
            <span className="text-[0.62rem] font-semibold uppercase tracking-wide text-app-text-muted">
              {t[key] as string}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {list.map((s) => {
                const active = selectedSymbol === s.symbol
                return (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => onSelect(s.symbol, s.stream_key, s.name)}
                    title={s.name}
                    className={
                      "flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.7rem] transition-colors " +
                      (active
                        ? "border-app-accent-blue bg-app-accent-blue/10"
                        : "border-app-border hover:border-app-border-subtle")
                    }
                  >
                    <span className="font-mono font-semibold text-app-text-primary">{s.symbol}</span>
                    {s.is_forecast && (
                      <span className="rounded bg-app-accent-blue/20 px-1 text-[0.55rem] font-semibold uppercase text-app-accent-blue">
                        ★
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
