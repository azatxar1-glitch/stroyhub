import type { Metadata } from "next";
import Link from "next/link";
import { UserSearch, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ExecutorCard } from "@/components/executor-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { FilterShell, FilterGroup } from "@/components/filters/filter-shell";
import { SortSelect } from "@/components/filters/sort-select";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LinkButton } from "@/components/ui/link-button";
import { plural } from "@/lib/trust";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Каталог строительных специалистов",
  description:
    "Найдите проверенного исполнителя: ПТО, сметчики, проектировщики, прорабы, технадзор. Фильтры по городу, цене, опыту, рейтингу и удалённой работе.",
};

type SearchParams = {
  category?: string;
  city?: string;
  remote?: string;
  q?: string;
  priceMax?: string;
  minExperience?: string;
  minRating?: string;
  minOrders?: string;
  registered?: string;
  sort?: string;
  page?: string;
};

/**
 * "Registered within N days" is resolved per request. This page is
 * force-dynamic and server-rendered, so reading the clock here is intended —
 * it is a query parameter, not client render state.
 */
function cutoffDate(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

const SORTS: Record<string, Prisma.ExecutorProfileOrderByWithRelationInput[]> = {
  rating: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
  orders: [{ completedOrders: "desc" }, { ratingAvg: "desc" }],
  priceAsc: [{ priceFrom: "asc" }],
  priceDesc: [{ priceFrom: "desc" }],
  experience: [{ experienceYears: "desc" }],
  newest: [{ createdAt: "desc" }],
};

export default async function ExecutorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const pageSize = 12;
  const sort = sp.sort && SORTS[sp.sort] ? sp.sort : "rating";

  const where: Prisma.ExecutorProfileWhereInput = {};
  if (sp.category) where.category = { slug: sp.category };
  if (sp.remote === "true") where.remoteAvailable = true;
  if (sp.minRating) where.ratingAvg = { gte: Number(sp.minRating) };
  if (sp.minExperience) where.experienceYears = { gte: Number(sp.minExperience) };
  if (sp.minOrders) where.completedOrders = { gte: Number(sp.minOrders) };
  if (sp.priceMax) where.priceFrom = { lte: Number(sp.priceMax) };
  if (sp.registered) {
    const days = Number(sp.registered);
    if (Number.isFinite(days) && days > 0) {
      where.createdAt = { gte: cutoffDate(days) };
    }
  }

  const andFilters: Prisma.ExecutorProfileWhereInput[] = [];
  if (sp.city) andFilters.push({ user: { city: { contains: sp.city, mode: "insensitive" } } });
  if (sp.q) {
    andFilters.push({
      OR: [
        { headline: { contains: sp.q, mode: "insensitive" } },
        { description: { contains: sp.q, mode: "insensitive" } },
        { user: { name: { contains: sp.q, mode: "insensitive" } } },
        { category: { name: { contains: sp.q, mode: "insensitive" } } },
        { skills: { some: { skill: { name: { contains: sp.q, mode: "insensitive" } } } } },
      ],
    });
  }
  if (andFilters.length) where.AND = andFilters;

  const [executors, total, categories, cities] = await Promise.all([
    prisma.executorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, city: true, phone: true } },
        category: true,
        skills: { include: { skill: true } },
      },
      orderBy: SORTS[sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.executorProfile.count({ where }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({
      where: { role: "EXECUTOR", city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);

  const activeCount = [
    sp.category,
    sp.city,
    sp.remote,
    sp.priceMax,
    sp.minExperience,
    sp.minRating,
    sp.minOrders,
    sp.registered,
  ].filter(Boolean).length;

  const filterFields = (
    <>
      <input type="hidden" name="q" value={sp.q ?? ""} />
      <input type="hidden" name="sort" value={sort} />

      <FilterGroup label="Категория">
        <Select name="category" defaultValue={sp.category ?? ""} aria-label="Категория">
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </FilterGroup>

      <FilterGroup label="Город">
        <Select name="city" defaultValue={sp.city ?? ""} aria-label="Город">
          <option value="">Любой город</option>
          {cities.map((c) => (
            <option key={c.city} value={c.city!}>
              {c.city}
            </option>
          ))}
        </Select>
      </FilterGroup>

      <FilterGroup label="Формат работы">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3.5 py-3 text-sm font-medium text-foreground transition-colors hover:border-border-strong has-checked:border-accent has-checked:bg-accent-soft">
          <input
            type="checkbox"
            name="remote"
            value="true"
            defaultChecked={sp.remote === "true"}
            className="h-4 w-4 rounded border-border-strong accent-[#f97316]"
          />
          Готов работать удалённо
        </label>
      </FilterGroup>

      <FilterGroup label="Стоимость до, ₽">
        <Input
          type="number"
          name="priceMax"
          min={0}
          step={1000}
          placeholder="Например, 50 000"
          defaultValue={sp.priceMax}
          aria-label="Максимальная стоимость"
        />
      </FilterGroup>

      <FilterGroup label="Опыт работы">
        <Select name="minExperience" defaultValue={sp.minExperience ?? ""} aria-label="Опыт работы">
          <option value="">Любой опыт</option>
          <option value="1">От 1 года</option>
          <option value="3">От 3 лет</option>
          <option value="5">От 5 лет</option>
          <option value="10">От 10 лет</option>
        </Select>
      </FilterGroup>

      <FilterGroup label="Рейтинг">
        <Select name="minRating" defaultValue={sp.minRating ?? ""} aria-label="Минимальный рейтинг">
          <option value="">Любой рейтинг</option>
          <option value="4">От 4.0</option>
          <option value="4.5">От 4.5</option>
          <option value="5">Только 5.0</option>
        </Select>
      </FilterGroup>

      <FilterGroup label="Выполнено заказов">
        <Select name="minOrders" defaultValue={sp.minOrders ?? ""} aria-label="Количество заказов">
          <option value="">Не важно</option>
          <option value="1">От 1 заказа</option>
          <option value="5">От 5 заказов</option>
          <option value="20">От 20 заказов</option>
        </Select>
      </FilterGroup>

      <FilterGroup label="На площадке">
        <Select name="registered" defaultValue={sp.registered ?? ""} aria-label="Дата регистрации">
          <option value="">Любое время</option>
          <option value="7">Меньше недели</option>
          <option value="30">Меньше месяца</option>
          <option value="365">Меньше года</option>
        </Select>
      </FilterGroup>
    </>
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Каталог исполнителей
        </h1>
        <p className="mt-2 text-muted">
          {total > 0
            ? `${total} ${plural(total, "специалист", "специалиста", "специалистов")} по вашему запросу`
            : "Проверенные специалисты строительной отрасли"}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[276px_1fr] lg:gap-8">
        <FilterShell action="/executors" activeCount={activeCount} resetHref="/executors">
          {filterFields}
        </FilterShell>

        <div className="min-w-0">
          {/* Search + sort row */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <form action="/executors" className="relative flex-1">
              {sp.category && <input type="hidden" name="category" value={sp.category} />}
              {sp.city && <input type="hidden" name="city" value={sp.city} />}
              {sp.remote && <input type="hidden" name="remote" value={sp.remote} />}
              <input type="hidden" name="sort" value={sort} />
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                name="q"
                defaultValue={sp.q}
                placeholder="Имя, специализация или навык…"
                aria-label="Поиск по исполнителям"
                className="pl-10"
              />
            </form>

            <div className="sm:w-60">
              <SortSelect
                defaultValue={sort}
                options={[
                  { value: "rating", label: "По рейтингу" },
                  { value: "orders", label: "По количеству заказов" },
                  { value: "experience", label: "По опыту" },
                  { value: "priceAsc", label: "Сначала дешевле" },
                  { value: "priceDesc", label: "Сначала дороже" },
                  { value: "newest", label: "Сначала новые" },
                ]}
              />
            </div>
          </div>

          {executors.length === 0 ? (
            <EmptyState
              icon={UserSearch}
              title="Специалисты не найдены"
              description="Под выбранные фильтры пока никто не подходит. Попробуйте расширить критерии или разместите заявку — исполнители откликнутся сами."
              action={<LinkButton href="/jobs/new">Создать заявку</LinkButton>}
              secondaryAction={
                <LinkButton href="/executors" variant="outline">
                  Сбросить фильтры
                </LinkButton>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {executors.map((ex) => (
                  <ExecutorCard key={ex.id} executor={ex} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={Math.ceil(total / pageSize)}
                basePath="/executors"
                searchParams={sp}
              />
            </>
          )}
        </div>
      </div>

      {executors.length > 0 && (
        <p className="mt-10 text-center text-sm text-muted">
          Не нашли подходящего специалиста?{" "}
          <Link href="/jobs/new" className="font-semibold text-accent-text hover:underline">
            Разместите заявку
          </Link>{" "}
          — исполнители откликнутся сами.
        </p>
      )}
    </div>
  );
}
