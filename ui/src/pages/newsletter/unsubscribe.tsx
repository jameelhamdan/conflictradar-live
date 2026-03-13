"use client";

import { useState, useEffect } from "react";

export default function UnsubscribePage() {
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = window.location.pathname.split("/").filter(Boolean).pop();
    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link.");
      return;
    }
    fetch(`/api/newsletter/unsubscribe/${token}/`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          const msg = data.detail ?? "";
          if (msg.toLowerCase().includes("already")) {
            setStatus("already");
          } else {
            setStatus("success");
          }
          setMessage(msg);
        } else {
          setStatus("error");
          setMessage(data.detail ?? "This link is invalid.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary">
      <nav className="simple-page-nav">
        <a href="/" className="text-[0.82rem] font-medium text-app-text-muted no-underline">
          ← Live map
        </a>
      </nav>

      <div className="simple-page-content">
        {status === "loading" && (
          <p className="text-[0.95rem] text-app-text-muted">Processing…</p>
        )}
        {(status === "success" || status === "already") && (
          <>
            <div className="mb-5 text-[2.5rem] leading-none">✓</div>
            <h1 className="mb-3 text-[1.4rem] font-bold tracking-[-0.01em] text-app-text-heading">
              {status === "already" ? "Already unsubscribed" : "Unsubscribed"}
            </h1>
            <p className="mb-8 text-[0.92rem] leading-[1.65] text-app-text-secondary">
              {status === "already"
                ? "This email is not on our mailing list."
                : "You've been removed from the daily briefing list. You won't receive any more emails from us."}
            </p>
            <a href="/" className="simple-page-link-default">
              Go to live map
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mb-5 text-[2rem] leading-none text-app-accent-red">✕</div>
            <h1 className="mb-3 text-[1.4rem] font-bold tracking-[-0.01em] text-app-text-heading">
              Invalid link
            </h1>
            <p className="mb-8 text-[0.92rem] leading-[1.65] text-app-text-secondary">
              {message}
            </p>
            <a href="/" className="simple-page-link-default">
              Go to live map
            </a>
          </>
        )}
      </div>
    </div>
  );
}
