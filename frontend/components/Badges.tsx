import { CATEGORY_STYLES } from "@/lib/format";
import type { TripCategory } from "@/types";

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export function CategoryBadge({ category }: { category: TripCategory }) {
  return <span className={`${base} ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Standard}`}>{category}</span>;
}

const STYLE_ICONS: Record<string, string> = {
  solo: "🧍", couple: "💑", family: "👨‍👩‍👧", friends: "🧑‍🤝‍🧑", business: "💼",
};

export function StyleBadge({ style }: { style: string | null }) {
  if (!style) return null;
  const icon = STYLE_ICONS[style.toLowerCase()] ?? "🎒";
  return (
    <span className={`${base} bg-violet-50 text-violet-700 ring-violet-600/20`}>
      <span aria-hidden className="mr-1">{icon}</span>
      {style}
    </span>
  );
}
