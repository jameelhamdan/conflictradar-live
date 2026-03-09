"use client";

import type { ReactNode } from "react";
import SubscribePopup from "./SubscribePopup";
import { useLanguage } from "../contexts/LanguageContext";

interface SiteHeaderProps {
  activePage?: string;
  /** Middle slot — replaces the flex spacer (e.g. time filters on the main page). */
  children?: ReactNode;
  /** Show Subscribe / Newsletter / About links. Defaults to true. */
  showNav?: boolean;
}

export default function SiteHeader({
  activePage,
  children,
  showNav = true,
}: SiteHeaderProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0 1rem",
        height: 44,
        background: "#13131c",
        borderBottom: "1px solid #1e1e2a",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <a
        href="/"
        style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
      >
        <span style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.01em", color: "#e8e8f0" }}>
          conflictradar
        </span>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.01em", color: "#e05252" }}>
          .live
        </span>
      </a>

      {/* Middle slot: flex spacer on plain pages, time filters + toggle on main page */}
      {children ?? <div style={{ flex: 1 }} />}

      {showNav && (
        <>
          <SubscribePopup />
          <a
            href="/newsletter"
            style={{
              color: activePage === "newsletter" ? "#e8e8f0" : "#55556a",
              fontSize: "0.8rem",
              fontWeight: 500,
              textDecoration: "none",
              padding: "0.2rem 0.45rem",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {t.newsletter}
          </a>
          <a
            href="/about"
            style={{
              color: activePage === "about" ? "#e8e8f0" : "#55556a",
              fontSize: "0.8rem",
              fontWeight: 500,
              textDecoration: "none",
              padding: "0.2rem 0.45rem",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {t.about}
          </a>
        </>
      )}

      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        title={lang === "en" ? "Switch to Arabic" : "Switch to English"}
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          padding: "0.18rem 0.55rem",
          borderRadius: 99,
          border: "1px solid #2a2a35",
          background: "#1a1a22",
          color: "#888899",
          cursor: "pointer",
          letterSpacing: "0.03em",
          flexShrink: 0,
        }}
      >
        {lang === "en" ? "ع" : "EN"}
      </button>
      <span style={{ fontSize: "0.7rem", color: "#33334a", fontFamily: "monospace", flexShrink: 0 }}>
        {__APP_VERSION__}
      </span>
    </nav>
  );
}
