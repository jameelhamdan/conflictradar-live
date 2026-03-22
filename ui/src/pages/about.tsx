"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { categoryColor } from "@/components/category";
import { CATEGORY_LABEL } from "../i18n/categories";
import { PageLayout, SiteLogo } from "../components/layout";
import { Card } from "@/components/ui/card";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const CONTACT_EMAIL = "contact@conflictradar.live";

const CATEGORY_KEYS = ["conflict", "protest", "disaster", "political", "economic", "crime", "general"] as const;

function AboutContent() {
  const { lang, t } = useLanguage();

  return (
    <div className="px-8 py-12 md:py-16 lg:py-20">
      <header className="mb-12 text-center">
        <div className="mb-4 inline-block rounded-full border border-app-accent-red/20 bg-app-accent-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-app-accent-red">
          {t.openSourceRealtime}
        </div>
        <h1 className="mb-4">
          <SiteLogo size="lg" />
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t.aboutHeroTagline}
        </p>
      </header>

      <section className="mb-10 border-t border-border pt-8">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground/90">
          {t.aboutWhatWeDoTitle}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          {t.aboutWhatWeDo}
        </p>
      </section>

      <section className="mb-10 border-t border-border pt-8">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground/90">
          {t.aboutLegendTitle}
        </h2>
        <div className="flex flex-col gap-2">
          {CATEGORY_KEYS.map((key) => {
            const color = categoryColor(key);
            const label = CATEGORY_LABEL[lang][key];
            const desc = t.categoryDescs[key];
            return (
              <div
                key={key}
                className="flex items-center gap-3"
                style={{ "--cat-color": color } as React.CSSProperties}
              >
                <span className="cat-legend-dot inline-block h-2.5 w-2.5 shrink-0 rounded-full" />
                <span className="cat-legend-label text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground/70 md:text-sm">{desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border pt-8">
        <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground/90">
          {t.aboutContactTitle}
        </h2>
        <div className="mb-6 flex flex-col gap-4">
          {[
            { icon: "✉", labelKey: "contactLabelGeneral" as const, note: null },
            { icon: "🔎", labelKey: "contactLabelData" as const, note: t.contactNoteData },
            { icon: "📰", labelKey: "contactLabelPress" as const, note: t.contactNotePress },
          ].map(({ icon, labelKey, note }) => (
            <Card
              key={labelKey}
              className="rounded-lg border-app-border bg-app-card p-6 ring-0 transition-colors hover:border-app-border-subtle"
            >
              <div className="mb-2 text-2xl leading-none">{icon}</div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {t[labelKey]}
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mb-1 inline-block text-sm font-semibold text-primary no-underline hover:underline md:text-base"
              >
                {CONTACT_EMAIL}
              </a>
              {note && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70 md:text-sm">
                  {note}
                </p>
              )}
            </Card>
          ))}
        </div>
        <p className="text-center text-sm leading-relaxed text-muted-foreground/60">
          {t.aboutContactFooter}
        </p>
      </section>
    </div>
  );
}

export default function AboutPage() {
  const { t } = useLanguage();
  useDocumentTitle(t.about);
  return (
    <PageLayout activePage="about">
      <AboutContent />
    </PageLayout>
  );
}
