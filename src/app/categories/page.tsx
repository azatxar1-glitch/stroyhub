import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { groupCategories } from "@/lib/category-groups";
import { CategoryCard } from "@/components/category-card";
import { LinkButton } from "@/components/ui/link-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Категории строительных специалистов",
  description:
    "Все направления СтройХаба: исполнительная документация, сметы, проектирование, работы на объекте, технический надзор и обследование зданий.",
};

export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.executorProfile.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);

  const categoryList = categories.length ? categories : CATEGORIES.map((c, i) => ({ ...c, id: String(i) }));
  const countByCategory = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const groups = groupCategories(categoryList.map((c) => ({ ...c, count: countByCategory.get(c.id) ?? 0 })));

  return (
    <div className="container-page py-10 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Категории специалистов</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Направления сгруппированы так, как устроены реальные строительные задачи — от подготовки документации до
          работ на объекте и контроля качества.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {groups.map((group) => (
          <section key={group.title}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">{group.title}</h2>
                <p className="mt-1 text-sm text-muted">{group.caption}</p>
              </div>
              <span className="text-sm text-faint">{group.items.length} направлений</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.map((cat) => (
                <CategoryCard key={cat.slug} category={cat} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <h2 className="text-xl font-bold text-foreground">Не нашли нужное направление?</h2>
        <p className="max-w-md text-sm text-muted">
          Опишите задачу в заявке — подходящие специалисты откликнутся сами.
        </p>
        <LinkButton href="/jobs/new" size="lg" className="gap-2">
          Создать заявку
          <ArrowRight size={18} aria-hidden />
        </LinkButton>
        <Link href="/executors" className="text-sm font-semibold text-accent-text hover:underline">
          Или посмотреть всех исполнителей
        </Link>
      </div>
    </div>
  );
}
