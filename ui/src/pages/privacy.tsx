import { useLanguage } from "../contexts/LanguageContext";
import markdownContent from "@/assets/docs/md/privacy.md?raw";
import { PageLayout } from "../components/layout";
import Markdown from "@/components/markdown";

const LAST_UPDATED = "2026-03-06";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <PageLayout activePage="privacy">
      <header className="mx-8 my-12 md:my-16 lg:my-20">
        <h1 className="mb-2 text-[1.9rem] font-extrabold tracking-tight text-app-text-heading">{t.privacyPageTitle}</h1>
        <p className="text-[0.82rem] text-app-text-secondary">
          {t.lastUpdated} {LAST_UPDATED}
        </p>
      </header>
      <Markdown content={markdownContent} />
    </PageLayout>
  );
}
