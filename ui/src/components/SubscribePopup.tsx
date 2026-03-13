import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSubscribe } from "../hooks/useSubscribe"
import { useLanguage } from "../contexts/LanguageContext"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SubscribePopup() {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { email, setEmail, status, message, handleSubmit, reset } = useSubscribe()
  const { t } = useLanguage()

  function toggle() {
    if (!open) {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
      reset()
    }
    setOpen((o) => !o)
  }

  useEffect(() => {
    if (!open) return
    function reposition() {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    }
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open])

  const panel =
    open && rect
      ? createPortal(
          <>
            <div onClick={() => setOpen(false)} className="fixed inset-0 z-[9998]" />
            <div
              className="subscribe-popup"
              style={{
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
              }}
            >
              <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-app-text-heading">
                {t.subscribeTitle}
              </div>
              <p className="mb-3 text-[0.78rem] leading-[1.5] text-app-text-secondary">
                {t.subscribeTagline}
              </p>

              {status === "success" ? (
                <p className="text-[0.8rem] leading-[1.5] text-app-accent-green">
                  {message ?? t.checkEmailConfirm}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <Input
                    type="email"
                    required
                    autoFocus
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    className="border-app-border-subtle bg-app-surface text-[0.82rem] text-app-text-heading placeholder:text-app-text-ghost focus-visible:border-app-border-subtle focus-visible:ring-0"
                  />
                  <Button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full border-none bg-app-accent-red text-[0.8rem] font-semibold text-white hover:bg-app-accent-red/90"
                  >
                    {status === "loading" ? t.subscribingLabel : t.subscribe}
                  </Button>
                  {status === "error" && message && (
                    <p className="text-[0.73rem] text-app-accent-red">{message}</p>
                  )}
                </form>
              )}
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={cn("subscribe-trigger", open ? "subscribe-trigger-open" : "subscribe-trigger-closed")}
      >
        {t.subscribe}
      </button>
      {panel}
    </>
  )
}
