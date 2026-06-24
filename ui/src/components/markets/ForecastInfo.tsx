'use client'

import { useEffect, useState } from "react"
import { fetchForecastAccuracy, fetchSymbols } from "../../api/streams"
import { useLanguage } from "../../contexts/LanguageContext"
import type { ForecastAccuracy, MarketSymbol } from "../../types"

// Expandable "how forecasting works" methodology panel for the Markets page (WA7).
// Summarises docs/forecasting.md: the base symbols, label-vs-features framing,
// horizons, router source, and live directional accuracy from the API.
export default function ForecastInfo() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [base, setBase] = useState<MarketSymbol[]>([])
  const [accuracy, setAccuracy] = useState<ForecastAccuracy[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetchSymbols({ forecast: true })
      .then((d) => { if (!cancelled) setBase(d.results) })
      .catch(() => {})
    fetchForecastAccuracy()
      .then((d) => { if (!cancelled) setAccuracy(d.results) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  return (
    <div className="rounded-lg border border-app-border bg-app-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2 text-[0.8rem] font-semibold text-app-text-heading"
      >
        <span>{t.forecastInfoTitle}</span>
        <span className="text-app-text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-app-border p-3 text-[0.74rem] text-app-text-primary">
          <p className="leading-snug text-app-text-muted">{t.forecastInfoHow}</p>

          <div>
            <span className="text-[0.62rem] font-semibold uppercase tracking-wide text-app-text-muted">
              {t.forecastInfoSymbols}
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {base.map((s) => (
                <span
                  key={s.symbol}
                  title={s.name}
                  className="rounded-md border border-app-border px-2 py-0.5 font-mono text-[0.7rem]"
                >
                  {s.symbol}
                </span>
              ))}
            </div>
          </div>

          <p className="text-app-text-muted">{t.forecastInfoHorizons}</p>

          {accuracy.length > 0 && (
            <div>
              <span className="text-[0.62rem] font-semibold uppercase tracking-wide text-app-text-muted">
                {t.forecastInfoAccuracy}
              </span>
              <div className="mt-1 flex flex-wrap gap-3">
                {accuracy.map((a) => (
                  <span key={a.horizon_days} className="font-mono tabular-nums">
                    {a.horizon_days}d:{" "}
                    {a.accuracy != null ? `${(a.accuracy * 100).toFixed(0)}%` : "n/a"}
                    <span className="text-app-text-muted"> ({a.scored})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
