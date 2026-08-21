import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, HardHat, Star, Search, Briefcase, FileSignature } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { groupCategories, POPULAR_SEARCH_SLUGS } from "@/lib/category-groups";
import { CategoryCard } from "@/components/category-card";
import { JobRow } from "@/components/job-card";
import { ExecutorCard } from "@/components/executor-card";
import { HeroSearch } from "@/components/hero-search";
import { ProcessSteps } from "@/components/process-steps";
import { LinkButton } from "@/components/ui/link-button";
import { SectionHeading } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, recentJobs, topExecutors, executorCities, categoryCounts] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { category: true, _count: { select: { proposals: true } } },
    }),
    prisma.executorProfile.findMany({
      orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
      take: 4,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, city: true, phone: true } },
        category: true,
        skills: { include: { skill: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "EXECUTOR", city: { not: null } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    prisma.executorProfile.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);

  const categoryList = categories.length ? categories : CATEGORIES.map((c, i) => ({ ...c, id: String(i) }));
  const countByCategory = new Map(categoryCounts.map((c) => [c.categoryId, c._count._all]));
  const groups = groupCategories(
    categoryList.map((c) => ({ ...c, count: countByCategory.get(c.id) ?? 0 }))
  );
  const cities = executorCities.map((c) => c.city!).filter(Boolean);
  const bySlug = new Map(categoryList.map((c) => [c.slug, c]));
  const popular = POPULAR_SEARCH_SLUGS.map((s) => bySlug.get(s)).filter(Boolean);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-primary text-white">
        <div className="blueprint-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />

        <div className="container-page relative py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80">
              <HardHat size={14} aria-hidden />
              Специализированная площадка строительной отрасли
            </span>

            <h1 className="mt-6 text-[30px] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[56px]">
              Найдите специалиста для любой строительной задачи
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              ПТО, сметчики, проектировщики, прорабы, строительные бригады и другие специалисты — в одном месте.
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-4xl">
            <HeroSearch cities={cities} />

            {popular.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-white/50">Популярное:</span>
                {popular.map((c) => (
                  <Link
                    key={c!.slug}
                    href={`/executors?category=${c!.slug}`}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/85 transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    {c!.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Two audiences ---------- */}
      <section className="container-page py-14 sm:py-16">
        <h2 className="text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Что вам нужно?
        </h2>

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          <article className="group relative overflow-hidden rounded-2xl border border-accent-border bg-accent-soft p-7 transition-shadow hover:shadow-[0_12px_32px_-16px_rgb(249_115_22/0.5)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Search size={22} aria-hidden />
            </span>
            <h3 className="mt-5 text-xl font-bold text-foreground">Мне нужен специалист</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Найдите исполнителя для своей задачи — сравните профили, рейтинг и портфолио.
            </p>
            <LinkButton href="/executors" size="lg" className="mt-6 w-full gap-2 sm:w-auto">
              Найти специалиста
              <ArrowRight size={18} aria-hidden />
            </LinkButton>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-border bg-primary p-7 text-white transition-shadow hover:shadow-[0_12px_32px_-16px_rgb(17_24_39/0.6)]">
            <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                <Briefcase size={22} aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-bold">Я ищу работу</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Получайте заявки от заказчиков по своей специализации и откликайтесь на подходящие.
              </p>
              <LinkButton href="/jobs" variant="onDark" size="lg" className="mt-6 w-full gap-2 sm:w-auto">
                Найти заявки
                <ArrowRight size={18} aria-hidden />
              </LinkButton>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- Categories, grouped ---------- */}
      <section className="border-t border-border bg-card py-14 sm:py-16">
        <div className="container-page">
          <SectionHeading
            title="Найдите специалиста по направлению"
            subtitle="Все направления строительной отрасли — от документации до работ на объекте"
            action={
              <Link
                href="/categories"
                className="hidden items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline sm:flex"
              >
                Все категории <ArrowRight size={15} aria-hidden />
              </Link>
            }
          />

          <div className="space-y-9">
            {groups.map((group) => (
              <div key={group.title}>
                <div className="mb-3.5 flex items-baseline gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{group.title}</h3>
                  <span className="hidden text-sm text-muted sm:block">{group.caption}</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((cat) => (
                    <CategoryCard key={cat.slug} category={cat} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Top executors ---------- */}
      {topExecutors.length > 0 && (
        <section className="container-page py-14 sm:py-16">
          <SectionHeading
            title="Популярные специалисты"
            subtitle="Высокий рейтинг и подтверждённый опыт работы через площадку"
            action={
              <Link
                href="/executors"
                className="hidden items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline sm:flex"
              >
                Все исполнители <ArrowRight size={15} aria-hidden />
              </Link>
            }
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topExecutors.map((ex) => (
              <ExecutorCard key={ex.id} executor={ex} />
            ))}
          </div>
          <LinkButton href="/executors" variant="outline" className="mt-6 w-full sm:hidden">
            Все исполнители
          </LinkButton>
        </section>
      )}

      {/* ---------- Why StroyHub ---------- */}
      <section className="border-y border-border bg-card py-14 sm:py-16">
        <div className="container-page">
          <SectionHeading
            title="Почему выбирают СтройХаб"
            subtitle="Площадка построена вокруг того, как реально устроены строительные заказы"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BadgeCheck,
                title: "Проверенные специалисты",
                text: "Статус «Проверенный» получают только исполнители с завершёнными заказами и рейтингом 4.5+.",
              },
              {
                icon: Star,
                title: "Отзывы от реальных заказчиков",
                text: "Отзыв можно оставить лишь после завершения заказа — накрутить рейтинг невозможно.",
              },
              {
                icon: ShieldCheck,
                title: "Безопасное взаимодействие",
                text: "Переписка, отклики и статусы заказа фиксируются на площадке, а не теряются в мессенджерах.",
              },
              {
                icon: HardHat,
                title: "Строительная специализация",
                text: "ПТО, АОСР, КС-2/КС-3, сметы, надзор — категории под реальные задачи отрасли.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-background p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
                  <item.icon size={20} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Recent jobs ---------- */}
      {recentJobs.length > 0 && (
        <section className="container-page py-14 sm:py-16">
          <SectionHeading
            title="Последние заявки"
            subtitle="Свежие задачи от заказчиков — отклик занимает минуту"
            action={
              <Link
                href="/jobs"
                className="hidden items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline sm:flex"
              >
                Все заявки <ArrowRight size={15} aria-hidden />
              </Link>
            }
          />
          <div className="space-y-3.5">
            {recentJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
          <LinkButton href="/jobs" variant="outline" className="mt-6 w-full sm:hidden">
            Все заявки
          </LinkButton>
        </section>
      )}

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="border-t border-border bg-card py-14 sm:py-16">
        <div className="container-page">
          <SectionHeading
            title="Как это работает"
            subtitle="Четыре шага от задачи до результата"
            action={
              <Link
                href="/how-it-works"
                className="hidden items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline sm:flex"
              >
                Подробнее <ArrowRight size={15} aria-hidden />
              </Link>
            }
          />
          <ProcessSteps />
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="container-page py-14 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="blueprint-grid pointer-events-none absolute inset-0" aria-hidden />
          <div
            className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Нужен специалист прямо сейчас?</h2>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              Разместите задачу и получите предложения от исполнителей с ценой и сроком.
            </p>
            <LinkButton href="/jobs/new" size="lg" className="mt-8 w-full gap-2 sm:w-auto">
              <FileSignature size={18} aria-hidden />
              Создать заявку
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}

