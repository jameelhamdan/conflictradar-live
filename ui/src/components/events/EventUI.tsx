import { useLanguage } from "../../contexts/LanguageContext";
import type { EventSummary } from "../../types";
import { CATEGORY_LABEL } from "../../i18n/categories";
import { CATEGORY_COLOR, categoryIcon, intensityColor } from "@/components/category";
import { cn } from "@/lib/utils";

export function timeAgo(isoStr: string, lang: "en" | "ar"): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === "ar" ? "الآن" : "just now";
  if (m < 60) return lang === "ar" ? `منذ ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "ar" ? `منذ ${h} س` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === "ar" ? `منذ ${d} ي` : `${d}d ago`;
}

export function useLocalizedField() {
  const { lang } = useLanguage();
  return <T extends Record<string, unknown>>(obj: T, base: string) => {
    if (lang === "ar") {
      const key = `${base}_ar`;
      if (typeof obj[key] === "string" && obj[key]) return obj[key] as string;
    }
    return (obj[base] as string) ?? "";
  };
}

export function CategoryBadge({ category, compact }: { category: string; compact?: boolean }) {
  const { lang } = useLanguage();
  const color = CATEGORY_COLOR[category as keyof typeof CATEGORY_COLOR] ?? CATEGORY_COLOR.general;
  const Icon = categoryIcon(category);
  const label = (CATEGORY_LABEL[lang] as Record<string, string>)[category] ?? category;

  return (
    <span
      className={cn("cat-badge", compact ? "cat-badge-compact" : "cat-badge-normal")}
      style={{ "--cat-color": color } as React.CSSProperties}
    >
      <Icon size={compact ? 9 : 12} color={color} />
      <span className="cat-badge-label">{label}</span>
    </span>
  );
}

interface EventMetaProps {
  event: EventSummary;
  compact?: boolean;
  showLocation?: boolean;
}

export function EventMeta({ event, compact, showLocation = true }: EventMetaProps) {
  const { t } = useLanguage();
  const pick = useLocalizedField();

  const loc = pick(event as unknown as Record<string, unknown>, "location_name");
  const intensity = event.avg_intensity;
  const hasIntensity = intensity != null;

  const metaItems: string[] = [];
  if (showLocation && loc) metaItems.push(loc);
  metaItems.push(t.articleCount(event.article_count, event.source_names));

  return (
    <div
      className={cn(
        "flex flex-wrap items-center text-app-text-ghost",
        compact ? "gap-[6px] text-[0.68rem]" : "gap-2 text-[0.75rem]",
      )}
    >
      {hasIntensity && (
        <span className="inline-flex items-center gap-1">
          <span
            className={cn("intensity-bar", compact ? "w-[30px]" : "w-10")}
            style={{ height: 4 }}
          >
            <span
              className="intensity-bar-fill"
              style={{
                width: `${Math.round(intensity! * 100)}%`,
                "--intensity-color": intensityColor(intensity!),
              } as React.CSSProperties}
            />
          </span>
        </span>
      )}
      {metaItems.map((m, i) => (
        <span key={i}>{m}</span>
      ))}
    </div>
  );
}
