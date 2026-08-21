import type { Metadata } from "next";
import Link from "next/link";
import { FileSearch, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { JobRow } from "@/components/job-card";
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
  title: "Лента строительных заявок",
  description:
    "Актуальные заказы от заказчиков: исполнительная документация, сметы, проектирование, работы на объекте. Фильтры по категории, городу, бюджету и формату работы.",
};

type SearchParams = {
  category?: string;
  city?: string;
  locationType?: string;
  q?: string;
  budgetMin?: string;
  budgetMax?: string;
  sort?: string;
  page?: string;
};

const SORTS: Record<string, Prisma.JobOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  budgetDesc: [{ budget: "desc" }],
  budgetAsc: [{ budget: "asc" }],
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const pageSize = 12;
  const sort = sp.sort && SORTS[sp.sort] ? sp.sort : "newest";

  const where: Prisma.JobWhereInput = { status: "OPEN" };
  if (sp.category) where.category = { slug: sp.category };
  if (sp.locationType) where.locationType = sp.locationType;

  if (sp.budgetMin || sp.budgetMax) {
    where.budget = {};
    if (sp.budgetMin) where.budget.gte = Number(sp.budgetMin);
    if (sp.budgetMax) where.budget.lte = Number(sp.budgetMax);
  }

  const andFilters: Prisma.JobWhereInput[] = [];
  if (sp.city) andFilters.push({ city: { contains: sp.city, mode: "insensitive" } });
  if (sp.q) {
    andFilters.push({
      OR: [
        { title: { contains: sp.q, mode: "insensitive" } },
        { description: { contains: sp.q, mode: "insensitive" } },
        { category: { name: { contains: sp.q, mode: "insensitive" } } },
      ],
    });
  }
  if (andFilters.length) where.AND = andFilters;

  const [jobs, total, categories, cities] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { category: true, _count: { select: { proposals: true } } },
      orderBy: SORTS[sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.job.findMany({
      where: { status: "OPEN" },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);

  const activeCount = [sp.category, sp.city, sp.locationType, sp.budgetMin, sp.budgetMax].filter(Boolean).length;

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
            <option key={c.city} value={c.city}>
              {c.city}
            </option>
          ))}
        </Select>
      </FilterGroup>

      <FilterGroup label="Формат работы">
        <Select name="locationType" defaultValue={sp.locationType ?? ""} aria-label="Формат работы">
          <option value="">Любой формат</option>
          <option value="REMOTE">Удалённо</option>
          <option value="ON_SITE">На объекте</option>
        </Select>
      </FilterGroup>

      <FilterGroup label="Бюджет, ₽">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            name="budgetMin"
            min={0}
            step={1000}
            placeholder="от"
            defaultValue={sp.budgetMin}
            aria-label="Бюджет от"
          />
          <span className="text-muted">—</span>
          <Input
            type="number"
            name="budgetMax"
            min={0}
            step={1000}
            placeholder="до"
            defaultValue={sp.budgetMax}
            aria-label="Бюджет до"
          />
        </div>
      </FilterGroup>
    </>
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Лента заявок</h1>
          <p className="mt-2 text-muted">
            {total > 0
              ? `${total} ${plural(total, "открытая заявка", "открытые заявки", "открытых заявок")}`
              : "Задачи от заказчиков строительной отрасли"}
          </p>
        </div>
        <LinkButton href="/jobs/new" className="hidden sm:inline-flex">
          Создать заявку
        </LinkButton>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[276px_1fr] lg:gap-8">
        <FilterShell action="/jobs" activeCount={activeCount} resetHref="/jobs">
          {filterFields}
        </FilterShell>

        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <form action="/jobs" className="relative flex-1">
              {sp.category && <input type="hidden" name="category" value={sp.category} />}
              {sp.city && <input type="hidden" name="city" value={sp.city} />}
              {sp.locationType && <input type="hidden" name="locationType" value={sp.locationType} />}
              <input type="hidden" name="sort" value={sort} />
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                name="q"
                defaultValue={sp.q}
                placeholder="Поиск по заявкам…"
                aria-label="Поиск по заявкам"
                className="pl-10"
              />
            </form>

            <div className="sm:w-56">
              <SortSelect
                defaultValue={sort}
                options={[
                  { value: "newest", label: "Сначала новые" },
                  { value: "budgetDesc", label: "Бюджет: по убыванию" },
                  { value: "budgetAsc", label: "Бюджет: по возрастанию" },
                ]}
              />
            </div>
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="Заявок не найдено"
              description="Под выбранные фильтры пока нет открытых заявок. Новые задачи публикуются регулярно — попробуйте расширить критерии."
              action={
                <LinkButton href="/jobs" variant="outline">
                  Сбросить фильтры
                </LinkButton>
              }
            />
          ) : (
            <>
              <div className="space-y-3.5">
                {jobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </div>
              <Pagination page={page} totalPages={Math.ceil(total / pageSize)} basePath="/jobs" searchParams={sp} />
            </>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card px-6 py-8 text-center sm:hidden">
        <p className="text-sm text-muted">Нужен исполнитель для вашей задачи?</p>
        <LinkButton href="/jobs/new" className="mt-4 w-full">
          Создать заявку
        </LinkButton>
      </div>

      <p className="mt-8 hidden text-center text-sm text-muted sm:block">
        Ищете специалиста, а не работу?{" "}
        <Link href="/executors" className="font-semibold text-accent-text hover:underline">
          Перейдите в каталог исполнителей
        </Link>
      </p>
    </div>
  );
}
