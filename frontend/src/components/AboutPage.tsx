'use client'

import SiteHeader from "./SiteHeader";
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";
import { categoryColor } from "../constants";
import { CATEGORY_LABEL } from "../i18n/categories";

const CONTACT_EMAIL = "contact@conflictradar.live";

const CATEGORY_KEYS = [
  'conflict', 'protest', 'disaster', 'political', 'economic', 'crime', 'general',
] as const;

function AboutContent() {
  const { lang, t } = useLanguage();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 2rem 5rem" }}>
      <header style={{ marginBottom: "3rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#e05252",
            background: "#e0525218",
            border: "1px solid #e0525230",
            borderRadius: 99,
            padding: "0.25rem 0.75rem",
            marginBottom: "1rem",
          }}
        >
          {t.openSourceRealtime}
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: "1rem",
          }}
        >
          <span style={{ color: "#e8e8f0" }}>conflictradar</span>
          <span style={{ color: "#e05252" }}>.live</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#888899", lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>
          {t.aboutHeroTagline}
        </p>
      </header>

      <section style={{ marginBottom: "2.5rem", borderTop: "1px solid #1a1a26", paddingTop: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#c8c8d8", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
          {t.aboutWhatWeDoTitle}
        </h2>
        <p style={{ color: "#888899", lineHeight: 1.75, fontSize: "0.95rem" }}>
          {t.aboutWhatWeDo}
        </p>
      </section>

      <section style={{ marginBottom: "2.5rem", borderTop: "1px solid #1a1a26", paddingTop: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#c8c8d8", marginBottom: "1rem", letterSpacing: "-0.01em" }}>
          {t.aboutLegendTitle}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {CATEGORY_KEYS.map((key) => {
            const color = categoryColor(key);
            const label = CATEGORY_LABEL[lang][key];
            const desc = t.categoryDescs[key];
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ color, fontWeight: 600, fontSize: "0.85rem" }}>{label}</span>
                <span style={{ color: "#55556a", fontSize: "0.82rem" }}>{desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ borderTop: "1px solid #1a1a26", paddingTop: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#c8c8d8", marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>
          {t.aboutContactTitle}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.75rem" }}>
          {([
            { icon: "✉", labelKey: "contactLabelGeneral" as const, note: null },
            { icon: "🔎", labelKey: "contactLabelData" as const, note: t.contactNoteData },
            { icon: "📰", labelKey: "contactLabelPress" as const, note: t.contactNotePress },
          ]).map(({ icon, labelKey, note }) => (
            <div
              key={labelKey}
              style={{ background: "#13131c", border: "1px solid #1e1e2a", borderRadius: 10, padding: "1.5rem" }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "0.5rem", lineHeight: 1 }}>{icon}</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#55556a", marginBottom: "0.35rem" }}>
                {t[labelKey]}
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                style={{ display: "inline-block", color: "#7c9ef8", fontSize: "0.95rem", fontWeight: 600, textDecoration: "none", marginBottom: note ? "0.4rem" : 0 }}
              >
                {CONTACT_EMAIL}
              </a>
              {note && (
                <p style={{ color: "#55556a", fontSize: "0.82rem", lineHeight: 1.6, marginTop: "0.35rem" }}>
                  {note}
                </p>
              )}
            </div>
          ))}
        </div>
        <p style={{ color: "#44445a", fontSize: "0.85rem", lineHeight: 1.7, textAlign: "center" }}>
          {t.aboutContactFooter}
        </p>
      </section>
    </div>
  );
}

function FooterLinks() {
  const { t } = useLanguage();
  return (
    <footer style={{ borderTop: '1px solid #1a1a26', padding: '1.25rem 2rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#44445a' }}>
      <a href="/terms" style={{ color: '#44445a', textDecoration: 'none' }}>{t.termsLink}</a>
      <a href="/privacy" style={{ color: '#44445a', textDecoration: 'none' }}>{t.privacyLink}</a>
    </footer>
  );
}

export default function AboutPage() {
  return (
    <LanguageProvider>
      <div style={{ minHeight: "100vh", background: "#0f0f13", color: "#e0e0e0" }}>
        <SiteHeader activePage="about" />
        <AboutContent />
        <FooterLinks />
      </div>
    </LanguageProvider>
  );
}
