import { useState, useEffect } from "react";
import { fetchNewsletter, fetchNewsletters } from "../api/newsletter";
import { useLanguage } from "../contexts/LanguageContext";
import type { NewsletterDetail, NewsletterSummary } from "../api/newsletter";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import StatusDisplay from "./StatusDisplay";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

interface ViewProps {
  date: string;
  /** If provided, skips the internal fetch and uses this data directly. */
  initialData?: NewsletterDetail;
  onBack?: () => void;
}

export function NewsletterView({ date, initialData, onBack }: ViewProps) {
  const { t } = useLanguage();
  const [newsletter, setNewsletter] = useState<NewsletterDetail | null>(initialData ?? null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    setLoading(true);
    setError(null);
    fetchNewsletter(date)
      .then(setNewsletter)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date, initialData]);

  const hasCover = Boolean(newsletter?.cover_image_url);

  return (
    <div className="flex h-full flex-col">
      {/* ── Hero header ── */}
      <div
        className={cn(
          "nl-hero",
          hasCover ? "nl-hero-with-cover min-h-[220px] bg-transparent" : "nl-hero-no-cover min-h-[110px] bg-app-surface",
        )}
      >
        {hasCover && (
          <img src={newsletter!.cover_image_url!} alt="" className="nl-hero-cover-img" />
        )}
        <div className={cn("nl-hero-overlay", hasCover ? "nl-hero-overlay-gradient" : "")} />

        <div className="relative z-10 px-5 pb-4">
          <div className="mb-[0.4rem] flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="cursor-pointer border-none bg-transparent p-0 text-[0.8rem] text-app-text-muted"
              >
                {t.back}
              </button>
            )}
            <span className="text-[0.78rem] text-app-text-secondary">
              {newsletter ? formatDate(newsletter.date) : formatDate(date)}
            </span>
            {newsletter && (
              <span className="text-[0.72rem] text-app-text-ghost">
                · {t.eventCount(newsletter.event_count)}
              </span>
            )}
          </div>

          {newsletter && (
            <h1 className="m-0 text-[1.35rem] font-bold leading-[1.3] tracking-[-0.01em] text-app-text-heading">
              {newsletter.subject}
            </h1>
          )}

          {newsletter?.cover_image_credit && (
            <p className="mt-[0.45rem] text-[0.67rem] italic text-app-text-ghost">
              {t.imageCredit} {newsletter.cover_image_credit}
            </p>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {loading && <StatusDisplay status="loading" message={t.loading} />}
        {error && <StatusDisplay status="error" message={error} />}
        {newsletter && !loading && (
          <div className="mx-auto max-w-[680px]">
            <div className="article-body">
              <ReactMarkdown>{newsletter.body}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ListProps {
  onSelect: (date: string) => void;
}

export function NewsletterList({ onSelect }: ListProps) {
  const { t } = useLanguage();
  const [newsletters, setNewsletters] = useState<NewsletterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsletters()
      .then((data) => setNewsletters(data.results))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StatusDisplay status="loading" message={t.loading} />;
  if (error) return <StatusDisplay status="error" message={error} />;
  if (newsletters.length === 0) return <StatusDisplay status="empty" message={t.noBriefingsYet} />;

  return (
    <div className="flex flex-col">
      {newsletters.map((nl) => (
        <button key={nl.id} onClick={() => onSelect(nl.date)} className="nl-list-btn">
          <div className="mb-[0.3rem] text-[0.72rem] text-app-text-muted">
            {formatDate(nl.date)}
            {nl.event_count > 0 && (
              <span className="ml-2 text-app-text-dim">· {t.eventCount(nl.event_count)}</span>
            )}
          </div>
          <div className="text-[0.88rem] font-semibold leading-[1.4] text-app-text-body">
            {nl.subject}
          </div>
        </button>
      ))}
    </div>
  );
}
