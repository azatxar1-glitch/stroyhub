import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";

export type CategoryCardData = {
  name: string;
  slug: string;
  icon: string | null;
  count?: number;
};

export function CategoryCard({ category }: { category: CategoryCardData }) {
  return (
    <Link
      href={`/executors?category=${category.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-border hover:shadow-[0_6px_18px_-10px_rgb(17_24_39/0.2)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground transition-colors group-hover:bg-accent-soft group-hover:text-accent-text-text">
        <CategoryIcon name={category.icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight text-foreground">{category.name}</span>
        {category.count !== undefined && category.count > 0 && (
          <span className="mt-0.5 block text-xs text-muted">{category.count} спец.</span>
        )}
      </span>
    </Link>
  );
}
