import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Wifi,
  Star,
  CircleDot,
  CalendarDays,
  Package,
  Phone,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating";
import { CategoryIcon } from "@/components/category-icon";
import { VerifiedMark, TrustSignalList } from "@/components/trust-badges";
import { ContactExecutorButtons } from "@/components/contact-executor";
import { ReportButton } from "@/components/report-button";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { formatMoney, formatDate } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { plural } from "@/lib/trust";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await prisma.executorProfile.findUnique({
    where: { id },
    include: { user: { select: { name: true, city: true } }, category: true },
  });
  if (!profile) return { title: "Специалист не найден" };

  return {
    title: `${profile.user.name} — ${profile.category.name}`,
    description: profile.headline,
    openGraph: {
      title: `${profile.user.name} — ${profile.category.name} · СтройХаб`,
      description: profile.headline,
    },
  };
}

export default async function ExecutorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const profile = await prisma.executorProfile.findUnique({
    where: { id },
    include: {
      user: true,
      category: true,
      skills: { include: { skill: true } },
      portfolioItems: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) notFound();

  const [reviews, completedOrders] = await Promise.all([
    prisma.review.findMany({
      where: { targetId: profile.userId },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        order: { include: { job: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.order.findMany({
      where: { executorId: profile.userId, status: "COMPLETED" },
      include: { job: { select: { title: true, category: { select: { name: true } } } } },
      orderBy: { completedAt: "desc" },
      take: 8,
    }),
  ]);

  const isSelf = session?.user.id === profile.userId;
  const isCustomer = session?.user.role === ROLES.CUSTOMER;
  const isAvailable = profile.availability !== "BUSY";

  const trust = {
    phone: profile.user.phone,
    ratingAvg: profile.ratingAvg,
    ratingCount: profile.ratingCount,
    completedOrders: profile.completedOrders,
    description: profile.description,
    skillsCount: profile.skills.length,
    portfolioCount: profile.portfolioItems.length,
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <Link
        href="/executors"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} aria-hidden /> Каталог исполнителей
      </Link>

      {/* ---------- Identity header ---------- */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-primary sm:h-24">
          <div className="blueprint-grid h-full w-full" aria-hidden />
        </div>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative -mt-10 shrink-0 sm:-mt-12">
              <Avatar
                name={profile.user.name}
                src={profile.user.avatarUrl}
                size={96}
                className="border-4 border-card"
              />
              <span
                title={isAvailable ? "Свободен для заказов" : "Занят"}
                className={`absolute bottom-1.5 right-1.5 h-5 w-5 rounded-full border-4 border-card ${
                  isAvailable ? "bg-success" : "bg-warning"
                }`}
              />
            </div>

            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{profile.user.name}</h1>
                <VerifiedMark input={trust} />
              </div>
              <p className="mt-1 text-base text-muted">{profile.headline}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5 text-sm">
            <Badge variant="accent">
              <CategoryIcon name={profile.category.icon} size={13} />
              {profile.category.name}
            </Badge>

            {profile.ratingCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <Star size={15} className="fill-accent text-accent" aria-hidden />
                <span className="font-bold text-foreground">{profile.ratingAvg.toFixed(1)}</span>
                <span className="text-muted">
                  · {profile.ratingCount} {plural(profile.ratingCount, "отзыв", "отзыва", "отзывов")}
                </span>
              </span>
            ) : (
              <span className="text-muted">Пока без отзывов</span>
            )}

            <span className="flex items-center gap-1.5 text-muted">
              <Package size={15} aria-hidden />
              {profile.completedOrders} {plural(profile.completedOrders, "заказ", "заказа", "заказов")}
            </span>

            <span className="flex items-center gap-1.5 text-muted">
              <MapPin size={15} aria-hidden />
              {profile.user.city ?? "Город не указан"}
            </span>

            <span className="flex items-center gap-1.5 text-muted">
              <CircleDot size={15} className={isAvailable ? "text-success-text" : "text-warning-text"} aria-hidden />
              {isAvailable ? "Свободен для заказов" : "Сейчас занят"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* ---------- Main column ---------- */}
        <div className="min-w-0 space-y-6">
          {profile.description && (
            <Section title="О специалисте">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                {profile.description}
              </p>
            </Section>
          )}

          <Section title="Опыт и формат работы">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat icon={Briefcase} label="Опыт работы">
                {profile.experienceYears > 0
                  ? `${profile.experienceYears} ${plural(profile.experienceYears, "год", "года", "лет")}`
                  : "Не указан"}
              </Stat>
              <Stat icon={Wifi} label="Удалённая работа">
                {profile.remoteAvailable ? "Доступна" : "Только на объекте"}
              </Stat>
              <Stat icon={CalendarDays} label="На площадке с">
                {formatDate(profile.createdAt)}
              </Stat>
            </dl>
          </Section>

          {profile.skills.length > 0 && (
            <Section title="Навыки и инструменты">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span
                    key={s.skillId}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    {s.skill.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {profile.portfolioItems.length > 0 && (
            <Section title={`Портфолио (${profile.portfolioItems.length})`}>
              <PortfolioGallery items={profile.portfolioItems} />
            </Section>
          )}

          {completedOrders.length > 0 && (
            <Section title="Выполненные заказы">
              <ul className="divide-y divide-border">
                {completedOrders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{order.job.title}</div>
                      <div className="text-xs text-muted">{order.job.category.name}</div>
                    </div>
                    <div className="text-right text-xs text-muted">
                      {order.completedAt ? formatDate(order.completedAt) : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={`Отзывы (${reviews.length})`}>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">
                У этого специалиста пока нет отзывов — они появляются после завершения заказа через площадку.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {reviews.map((r) => (
                  <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.author.name} src={r.author.avatarUrl} size={34} />
                        <div>
                          <div className="text-sm font-semibold text-foreground">{r.author.name}</div>
                          <div className="text-xs text-muted">{formatDate(r.createdAt)}</div>
                        </div>
                      </div>
                      <RatingStars value={r.rating} showValue={false} size={15} />
                    </div>
                    {r.comment && (
                      <p className="mt-2.5 text-sm leading-relaxed text-foreground">{r.comment}</p>
                    )}
                    <p className="mt-2 text-xs text-muted">Заказ: {r.order.job.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* ---------- Sticky action rail ---------- */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent>
              <div className="text-sm text-muted">Стоимость работ</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                {profile.priceFrom ? `от ${formatMoney(profile.priceFrom)}` : "Договорная"}
              </div>
              <p className="mt-2 text-sm text-muted">
                Итоговая цена и срок фиксируются в отклике на вашу заявку.
              </p>

              <div className="mt-5">
                {isSelf ? (
                  <Link
                    href="/dashboard/profile"
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                  >
                    Редактировать профиль
                  </Link>
                ) : session && isCustomer ? (
                  <ContactExecutorButtons executorUserId={profile.userId} />
                ) : session ? (
                  <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">
                    Написать специалисту может заказчик. Переключитесь на аккаунт заказчика или разместите заявку.
                  </p>
                ) : (
                  <Link
                    href={`/login?callbackUrl=/executors/${profile.id}`}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
                  >
                    Войти, чтобы написать
                  </Link>
                )}
              </div>

              {!isSelf && (
                <Link
                  href="/jobs/new"
                  className="mt-2.5 flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  Разместить заявку
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="mb-4 text-sm font-bold text-foreground">Подтверждённые данные</h2>
              <TrustSignalList input={trust} />
              {profile.user.phone && isSelf && (
                <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
                  <Phone size={14} aria-hidden />
                  {profile.user.phone}
                </p>
              )}
            </CardContent>
          </Card>

          {session && !isSelf && (
            <div className="px-1">
              <ReportButton targetType="USER" targetId={profile.userId} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        <Icon size={13} />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold text-foreground">{children}</dd>
    </div>
  );
}
