import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSubscribe } from "../hooks/useSubscribe"
import { useLanguage } from "../contexts/LanguageContext"

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
            <div
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            />
            <div
              style={{
                position: "fixed",
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
                zIndex: 9999,
                background: "#1a1a22",
                border: "1px solid #2a2a35",
                borderRadius: 8,
                padding: "1rem",
                width: 260,
                boxShadow: "0 8px 32px #00000099",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#e8e8f0",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem",
                }}
              >
                {t.subscribeTitle}
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#888899",
                  margin: "0 0 0.75rem",
                  lineHeight: 1.5,
                }}
              >
                {t.subscribeTagline}
              </p>

              {status === "success" ? (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#52c8a0",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {message ?? t.checkEmailConfirm}
                </p>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                >
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    style={{
                      background: "#13131c",
                      border: "1px solid #2a2a35",
                      borderRadius: 4,
                      color: "#e8e8f0",
                      fontSize: "0.82rem",
                      padding: "0.45rem 0.6rem",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    style={{
                      background: "#e05252",
                      border: "none",
                      borderRadius: 4,
                      color: "#fff",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      padding: "0.5rem 0",
                      cursor: status === "loading" ? "default" : "pointer",
                      opacity: status === "loading" ? 0.6 : 1,
                    }}
                  >
                    {status === "loading" ? t.subscribingLabel : t.subscribe}
                  </button>
                  {status === "error" && message && (
                    <p style={{ fontSize: "0.73rem", color: "#e05252", margin: 0 }}>
                      {message}
                    </p>
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
        style={{
          background: open ? "#e0525222" : "transparent",
          border: `1px solid ${open ? "#e0525244" : "transparent"}`,
          borderRadius: 4,
          color: open ? "#e05252" : "#55556a",
          fontSize: "0.8rem",
          fontWeight: 600,
          padding: "0.2rem 0.55rem",
          cursor: "pointer",
          transition: "color 0.12s, background 0.12s, border-color 0.12s",
          flexShrink: 0,
        }}
      >
        {t.subscribe}
      </button>
      {panel}
    </>
  )
}

