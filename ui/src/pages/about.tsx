"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { categoryColor } from "@/components/category";
import { CATEGORY_LABEL } from "../i18n/categories";
import { PageLayout  } from "../components/layout";

const CONTACT_EMAIL = "contact@conflictradar.live";

const CATEGORY_KEYS = ["conflict", "protest", "disaster", "political", "economic", "crime", "general"] as const;

function AboutContent() {
  const { lang, t } = useLanguage();

  return (
    <div className="px-8 py-12 md:py-16 lg:py-20">
      <header className="mb-12 text-center">
        <div className="inline-block text-xs font-semibold tracking-wider uppercase text-[#e05252] bg-[#e05252]/10 border border-[#e05252]/20 rounded-full px-3 py-1 mb-4">
          {t.openSourceRealtime}
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-4">
          <span className="text-foreground">conflictradar</span>
          <span className="text-[#e05252]">.live</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {t.aboutHeroTagline}
        </p>
      </header>

      <section className="mb-10 border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground/90 mb-4 tracking-tight">
          {t.aboutWhatWeDoTitle}
        </h2>
        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
          {t.aboutWhatWeDo}
        </p>
      </section>

      <section className="mb-10 border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground/90 mb-4 tracking-tight">
          {t.aboutLegendTitle}
        </h2>
        <div className="flex flex-col gap-2">
          {CATEGORY_KEYS.map((key) => {
            const color = categoryColor(key);
            const label = CATEGORY_LABEL[lang][key];
            const desc = t.categoryDescs[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-sm" style={{ color }}>
                  {label}
                </span>
                <span className="text-muted-foreground/70 text-xs md:text-sm">
                  {desc}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground/90 mb-5 tracking-tight">
          {t.aboutContactTitle}
        </h2>
        <div className="flex flex-col gap-4 mb-6">
          {[
            { icon: "✉", labelKey: "contactLabelGeneral" as const, note: null },
            { icon: "🔎", labelKey: "contactLabelData" as const, note: t.contactNoteData },
            { icon: "📰", labelKey: "contactLabelPress" as const, note: t.contactNotePress },
          ].map(({ icon, labelKey, note }) => (
            <div
              key={labelKey}
              className="bg-card border border-border rounded-lg p-6 hover:border-border/80 transition-colors"
            >
              <div className="text-2xl mb-2 leading-none">{icon}</div>
              <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/70 mb-1">
                {t[labelKey]}
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-block text-primary text-sm md:text-base font-semibold no-underline hover:underline mb-1"
              >
                {CONTACT_EMAIL}
              </a>
              {note && (
                <p className="text-muted-foreground/70 text-xs md:text-sm leading-relaxed mt-1">
                  {note}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground/60 text-sm leading-relaxed text-center">
          {t.aboutContactFooter}
        </p>
      </section>
    </div>
  );
}

export default function AboutPage() {
  return (
    <PageLayout activePage="about">
      <AboutContent />
    </PageLayout>
  );
}
