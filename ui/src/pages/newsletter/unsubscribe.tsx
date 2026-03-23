"use client";

import { useState, useEffect } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useLanguage } from "../../contexts/LanguageContext";

export default function UnsubscribePage() {
  const { t } = useLanguage();
  useDocumentTitle(t.unsubscribeTitle);
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = window.location.pathname.split("/").filter(Boolean).pop();
    if (!token) {
      setStatus("error");
      setMessage(t.invalidUnsubscribeLink);
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
          setMessage(data.detail ?? t.invalidLink);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage(t.somethingWentWrong);
      });
  }, []);

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary">
      <nav className="simple-page-nav">
        <a href="/" className="text-[0.82rem] font-medium text-app-text-muted no-underline">
          {t.backToLiveMap}
        </a>
      </nav>

      <div className="simple-page-content">
        {status === "loading" && (
          <p className="text-[0.95rem] text-app-text-muted">{t.processingUnsubscribe}</p>
        )}
        {(status === "success" || status === "already") && (
          <>
            <div className="mb-5 text-[2.5rem] leading-none">✓</div>
            <h1 className="mb-3 text-[1.4rem] font-bold tracking-[-0.01em] text-app-text-heading">
              {status === "already" ? t.alreadyUnsubscribed : t.unsubscribed}
            </h1>
            <p className="mb-8 text-[0.92rem] leading-[1.65] text-app-text-secondary">
              {status === "already" ? t.notOnMailingList : t.removedFromList}
            </p>
            <a href="/" className="simple-page-link-default">
              {t.goToLiveMap}
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mb-5 text-[2rem] leading-none text-app-accent-red">✕</div>
            <h1 className="mb-3 text-[1.4rem] font-bold tracking-[-0.01em] text-app-text-heading">
              {t.invalidLink}
            </h1>
            <p className="mb-8 text-[0.92rem] leading-[1.65] text-app-text-secondary">
              {message}
            </p>
            <a href="/" className="simple-page-link-default">
              {t.goToLiveMap}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
