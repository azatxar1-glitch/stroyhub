import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { JobCard } from "@/components/job-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { FileSearch } from "lucide-react";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  city?: string;
  locationType?: string;
  q?: string;
  page?: string;
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const pageSize = 12;

  const where: Prisma.JobWhereInput = { status: "OPEN" };
  if (sp.category) where.category = { slug: sp.category };
  if (sp.city) where.city = { contains: sp.city };
  if (sp.locationType) where.locationType = sp.locationType;
  if (sp.q) where.OR = [{ title: { contains: sp.q } }, { description: { contains: sp.q } }];

  const [jobs, total, categories] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { category: true, _count: { select: { proposals: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  const categoryList = categories.length ? categories : CATEGORIES.map((c, i) => ({ ...c, id: String(i) }));

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Лента заявок</h1>
          <p className="mt-1 text-muted">Найдите задачу, подходящую вашей специализации</p>
        </div>
        <LinkButton href="/jobs/new" variant="accent">
          Разместить заявку
        </LinkButton>
      </div>

      <form className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-4">
        <Input name="q" placeholder="Поиск по заявкам..." defaultValue={sp.q} className="sm:col-span-2" />
        <Select name="category" defaultValue={sp.category ?? ""}>
          <option value="">Все категории</option>
          {categoryList.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input name="city" placeholder="Город" defaultValue={sp.city} />
        <button
          type="submit"
          className="col-span-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 sm:col-span-1 sm:col-start-4"
        >
          Найти
        </button>
      </form>

      {jobs.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Заявок не найдено"
          description="Попробуйте изменить параметры поиска или загляните позже — новые заявки публикуются регулярно."
          action={
            <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
              Сбросить фильтры
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={Math.ceil(total / pageSize)}
            basePath="/jobs"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
