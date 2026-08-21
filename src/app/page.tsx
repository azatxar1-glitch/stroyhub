import Link from "next/link";
import { ArrowRight, ShieldCheck, Search, MessagesSquare, BadgeCheck, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import { JobCard } from "@/components/job-card";
import { ExecutorCard } from "@/components/executor-card";
import { LinkButton } from "@/components/ui/link-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, recentJobs, topExecutors, stats] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { category: true, _count: { select: { proposals: true } } },
    }),
    prisma.executorProfile.findMany({
      orderBy: [{ ratingAvg: "desc" }, { completedOrders: "desc" }],
      take: 4,
      include: { user: { select: { id: true, name: true, avatarUrl: true, city: true } }, category: true },
    }),
    prisma.$transaction([
      prisma.user.count({ where: { role: "EXECUTOR" } }),
      prisma.job.count(),
      prisma.order.count({ where: { status: "COMPLETED" } }),
    ]),
  ]);

  const [executorsCount, jobsCount, completedCount] = stats;
  const categoryList = categories.length ? categories : CATEGORIES.map((c, i) => ({ ...c, id: String(i) }));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-primary text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <ShieldCheck size={14} /> Проверенные специалисты строительной отрасли
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Найдите специалиста для строительной задачи
            </h1>
            <p className="mt-5 text-lg text-white/75">
              ПТО, сметчики, проектировщики, рабочие и подрядчики — в одном месте.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/executors" size="lg" variant="accent" className="gap-2">
                Найти исполнителя <ArrowRight size={18} />
              </LinkButton>
              <LinkButton href="/jobs/new" size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                Разместить заявку
              </LinkButton>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/15 pt-8 text-center sm:text-left">
              <div>
                <div className="text-2xl font-bold">{executorsCount}+</div>
                <div className="text-sm text-white/60">исполнителей</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{jobsCount}+</div>
                <div className="text-sm text-white/60">размещённых заявок</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{completedCount}+</div>
                <div className="text-sm text-white/60">завершённых заказов</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Категории услуг</h2>
            <p className="mt-1 text-muted">Выберите нужную специализацию</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categoryList.map((cat) => (
            <Link
              key={cat.slug}
              href={`/executors?category=${cat.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <CategoryIcon name={cat.icon} size={20} />
              </span>
              <span className="text-sm font-medium leading-tight text-foreground">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top executors */}
      {topExecutors.length > 0 && (
        <section className="border-t border-border bg-surface/60 py-16">
          <div className="container-page">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Популярные специалисты</h2>
                <p className="mt-1 text-muted">Высокий рейтинг и подтверждённый опыт</p>
              </div>
              <Link href="/executors" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
                Все исполнители <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {topExecutors.map((ex) => (
                <ExecutorCard key={ex.id} executor={ex} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent jobs */}
      {recentJobs.length > 0 && (
        <section className="container-page py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Последние заявки</h2>
              <p className="mt-1 text-muted">Свежие задачи от заказчиков</p>
            </div>
            <Link href="/jobs" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
              Все заявки <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Benefits / how it works */}
      <section id="how-it-works" className="border-t border-border bg-primary py-16 text-white">
        <div className="container-page">
          <h2 className="mb-10 text-center text-2xl font-bold">Как это работает</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: "Опишите задачу", text: "Создайте заявку: категория, объект, сроки и бюджет" },
              { icon: MessagesSquare, title: "Получите отклики", text: "Исполнители предложат цену и срок выполнения" },
              { icon: BadgeCheck, title: "Выберите специалиста", text: "Сравните профили, рейтинги и портфолио" },
              { icon: Star, title: "Оцените результат", text: "После завершения работы оставьте отзыв" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-white/5 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-white">
                  <s.icon size={20} />
                </div>
                <h3 className="mb-1.5 font-semibold">{s.title}</h3>
                <p className="text-sm text-white/70">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
