import { useLanguage } from "../../contexts/LanguageContext";
import type { EventSummary } from "../../types";
import { CATEGORY_LABEL } from "../../i18n/categories";
import { CATEGORY_COLOR, categoryIcon, intensityColor } from "@/components/category";

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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: compact ? "0.12rem 0.45rem" : "0.14rem 0.5rem",
        borderRadius: 999,
        border: `1px solid ${color}55`,
        background: `${color}20`,
      }}
    >
      <Icon size={compact ? 10 : 12} color={color} />
      {!compact && (
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

interface EventMetaProps {
  event: EventSummary;
  compact?: boolean;
  showLocation?: boolean;
}

export function EventMeta({ event, compact, showLocation = true }: EventMetaProps) {
  const { lang, t } = useLanguage();
  const pick = useLocalizedField();

  const loc = pick(event as unknown as Record<string, unknown>, "location_name");
  const intensity = event.avg_intensity;
  const hasIntensity = intensity != null;

  const metaItems: string[] = [];
  if (showLocation && loc) metaItems.push(loc);
  metaItems.push(t.articleCount(event.article_count));

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: compact ? 6 : 8,
        fontSize: compact ? "0.68rem" : "0.75rem",
        color: "#666",
        alignItems: "center",
      }}
    >
      {hasIntensity && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              width: compact ? 30 : 40,
              height: 4,
              borderRadius: 999,
              background: "#222233",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                display: "block",
                width: `${Math.round(intensity! * 100)}%`,
                height: "100%",
                background: intensityColor(intensity!),
              }}
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
