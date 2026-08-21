import Link from "next/link";
import { UserSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ExecutorCard } from "@/components/executor-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  city?: string;
  remote?: string;
  q?: string;
  minRating?: string;
  page?: string;
};

export default async function ExecutorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const pageSize = 12;

  const where: Prisma.ExecutorProfileWhereInput = {};
  if (sp.category) where.category = { slug: sp.category };
  if (sp.remote === "true") where.remoteAvailable = true;
  if (sp.minRating) where.ratingAvg = { gte: Number(sp.minRating) };
  if (sp.city) where.user = { city: { contains: sp.city } };
  if (sp.q) where.OR = [{ headline: { contains: sp.q } }, { user: { name: { contains: sp.q } } }];

  const [executors, total, categories] = await Promise.all([
    prisma.executorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, city: true } },
        category: true,
      },
      orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.executorProfile.count({ where }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  const categoryList = categories.length ? categories : CATEGORIES.map((c, i) => ({ ...c, id: String(i) }));

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Каталог исполнителей</h1>
        <p className="mt-1 text-muted">Проверенные специалисты строительной отрасли</p>
      </div>

      <form className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-5">
        <Input name="q" placeholder="Имя или специализация..." defaultValue={sp.q} className="sm:col-span-2" />
        <Select name="category" defaultValue={sp.category ?? ""}>
          <option value="">Все категории</option>
          {categoryList.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input name="city" placeholder="Город" defaultValue={sp.city} />
        <Select name="minRating" defaultValue={sp.minRating ?? ""}>
          <option value="">Любой рейтинг</option>
          <option value="4">От 4 звёзд</option>
          <option value="4.5">От 4.5 звёзд</option>
        </Select>
        <label className="col-span-full flex items-center gap-2 text-sm text-foreground sm:col-span-2">
          <input type="checkbox" name="remote" value="true" defaultChecked={sp.remote === "true"} className="h-4 w-4 rounded border-border" />
          Готов к удалённой работе
        </label>
        <button
          type="submit"
          className="col-span-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 sm:col-span-1 sm:col-start-5"
        >
          Найти
        </button>
      </form>

      {executors.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title="Исполнители не найдены"
          description="Попробуйте изменить параметры поиска."
          action={
            <Link href="/executors" className="text-sm font-medium text-primary hover:underline">
              Сбросить фильтры
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {executors.map((ex) => (
              <ExecutorCard key={ex.id} executor={ex} />
            ))}
          </div>
          <Pagination page={page} totalPages={Math.ceil(total / pageSize)} basePath="/executors" searchParams={sp} />
        </>
      )}
    </div>
  );
}
