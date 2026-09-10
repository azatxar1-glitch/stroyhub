import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, UserSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ExecutorCard } from "@/components/executor-card";
import { JobRow } from "@/components/job-card";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { SectionHeading } from "@/components/ui/card";
import { CategoryLead } from "@/components/category-lead";
import { plural } from "@/lib/plural";

export const dynamic = "force-dynamic";

/**
 * Посадочная страница направления.
 *
 * Живёт в /categories/<слаг>, а не в /executors/<слаг>: там уже есть
 * /executors/[id] для профилей, и слаг попадал бы в этот маршрут.
 */
export async function generateStaticParams() {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Направление не найдено" };

  const title = `${category.name} — специалисты и заявки`;
  const description = `Найдите специалиста по направлению «${category.name}» на СтройХабе: рейтинг, опыт, портфолио и отклики с ценой и сроком. Или разместите заявку и получите предложения.`;

  return {
    title,
    description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: { title: `${title} · СтройХаб`, description, url: `/categories/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const [executors, jobs, executorCount] = await Promise.all([
    prisma.executorProfile.findMany({
      where: { categoryId: category.id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, city: true, phone: true } },
        category: true,
        skills: { include: { skill: true } },
      },
      orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
      take: 9,
    }),
    prisma.job.findMany({
      where: { categoryId: category.id, status: "OPEN" },
      include: { category: true, _count: { select: { proposals: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.executorProfile.count({ where: { categoryId: category.id } }),
  ]);

  return (
    <div className="container-page py-8 sm:py-10">
      <Link
        href="/categories"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} aria-hidden /> Все направления
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-8">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-foreground">
            <CategoryIcon name={category.icon} size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {category.name}
            </h1>
            <p className="mt-2 text-muted">
              {executorCount > 0
                ? `${executorCount} ${plural(executorCount, ["специалист", "специалиста", "специалистов"])} по направлению`
                : "Специалисты этого направления"}
            </p>
          </div>
        </div>

        <LinkButton href="/jobs/new" className="gap-2">
          Разместить заявку
          <ArrowRight size={17} aria-hidden />
        </LinkButton>
      </header>

      <section className="mt-10">
        <SectionHeading
          title="Специалисты"
          subtitle={`Исполнители, работающие по направлению «${category.name}»`}
          action={
            executors.length > 0 ? (
              <Link
                href={`/executors?category=${slug}`}
                className="hidden items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline sm:flex"
              >
                Все с фильтрами <ArrowRight size={15} aria-hidden />
              </Link>
            ) : undefined
          }
        />

        {executors.length === 0 ? (
          /* Пустое направление — не тупик: оставляем способ получить исполнителя. */
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <EmptyState
              icon={UserSearch}
              title={`По направлению «${category.name}» пока нет профилей`}
              description="Специалисты только начинают заполнять профили. Оставьте заявку — она будет видна всем, кто зарегистрируется по этому направлению, и вы получите отклики."
              className="border-0 bg-transparent py-6"
              action={<LinkButton href="/jobs/new">Разместить заявку</LinkButton>}
            />
            <div className="mt-6 border-t border-border pt-6">
              <CategoryLead categorySlug={slug} categoryName={category.name} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {executors.map((ex) => (
              <ExecutorCard key={ex.id} executor={ex} />
            ))}
          </div>
        )}
      </section>

      {jobs.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            title="Открытые заявки"
            subtitle={`Задачи заказчиков по направлению «${category.name}»`}
            action={
              <Link
                href={`/jobs?category=${slug}`}
                className="hidden items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline sm:flex"
              >
                Все заявки <ArrowRight size={15} aria-hidden />
              </Link>
            }
          />
          <div className="space-y-3.5">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
