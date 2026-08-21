import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Clock,
  Paperclip,
  ArrowLeft,
  Wallet,
  Wifi,
  Users,
  CalendarDays,
  Building2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { JobStatusBadge } from "@/components/status-badge";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, formatDate, timeAgo } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { plural } from "@/lib/trust";
import { ProposalForm } from "./proposal-form";
import { ProposalsManager } from "./proposals-manager";
import { JobOwnerActions } from "./job-owner-actions";
import { ReportButton } from "@/components/report-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!job) return { title: "Заявка не найдена" };

  return {
    title: job.title,
    description: job.description.slice(0, 160),
    openGraph: { title: `${job.title} · СтройХаб`, description: job.description.slice(0, 160) },
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      category: true,
      attachments: true,
      customer: { select: { id: true, name: true, avatarUrl: true, city: true, createdAt: true } },
      _count: { select: { proposals: true } },
    },
  });

  if (!job) notFound();

  const isOwner = session?.user.id === job.customerId;
  const isAdmin = session?.user.role === ROLES.ADMIN;
  const isExecutor = session?.user.role === ROLES.EXECUTOR;
  const isOpen = job.status === "OPEN";
  const isRemote = job.locationType === "REMOTE";

  let alreadyApplied = false;
  if (isExecutor && session?.user.id) {
    const existing = await prisma.proposal.findUnique({
      where: { jobId_executorId: { jobId: job.id, executorId: session.user.id } },
    });
    alreadyApplied = !!existing;
  }

  let proposals: Awaited<ReturnType<typeof loadProposals>> = [];
  if (isOwner || isAdmin) {
    proposals = await loadProposals(job.id);
  }

  const [customerJobsCount] = await Promise.all([prisma.job.count({ where: { customerId: job.customerId } })]);

  return (
    <div className="container-page py-6 sm:py-10">
      <Link
        href="/jobs"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} aria-hidden /> Лента заявок
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* ---------- Main column ---------- */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">
                  <CategoryIcon name={job.category.icon} size={13} />
                  {job.category.name}
                </Badge>
                <JobStatusBadge status={job.status} />
                {isOpen && (
                  <span className="text-sm font-medium text-success-text">Ищем исполнителя</span>
                )}
                <span className="ml-auto text-xs text-muted">{timeAgo(job.createdAt)}</span>
              </div>

              <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-[28px]">
                {job.title}
              </h1>

              {/* Commercial terms as a labelled grid — the first thing an executor reads. */}
              <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
                <Term icon={Wallet} label="Бюджет" value={formatMoney(job.budget)} emphasis />
                <Term icon={Clock} label="Срок" value={job.deadline || "Обсуждается"} />
                <Term
                  icon={isRemote ? Wifi : MapPin}
                  label="Формат"
                  value={isRemote ? "Удалённо" : "На объекте"}
                />
                <Term icon={Users} label="Откликов" value={String(job._count.proposals)} />
              </dl>

              <div className="mt-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-faint">Описание задачи</h2>
                <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                  {job.description}
                </div>
              </div>

              {!isRemote && (job.city || job.address) && (
                <div className="mt-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-faint">Место работы</h2>
                  <p className="mt-2.5 flex items-center gap-2 text-[15px] text-foreground">
                    <MapPin size={16} className="text-muted" aria-hidden />
                    {job.city}
                    {job.address ? `, ${job.address}` : ""}
                  </p>
                </div>
              )}

              {job.attachments.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-faint">
                    Прикреплённые файлы ({job.attachments.length})
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {job.attachments.map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-accent-soft"
                        >
                          <Paperclip size={15} className="shrink-0 text-muted" aria-hidden />
                          <span className="truncate">{a.filename}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(isOwner || isAdmin) && (
                <div className="mt-6 border-t border-border pt-5">
                  <JobOwnerActions jobId={job.id} status={job.status} />
                </div>
              )}
            </CardContent>
          </Card>

          {(isOwner || isAdmin) && (
            <Card>
              <CardContent>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Отклики специалистов{" "}
                    <span className="font-semibold text-muted">({proposals.length})</span>
                  </h2>
                  {isOpen && proposals.length > 0 && (
                    <span className="text-sm text-muted">Выберите одного исполнителя</span>
                  )}
                </div>
                <ProposalsManager jobId={job.id} proposals={proposals} jobOpen={isOpen} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---------- Action rail ---------- */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Executor action */}
          {isExecutor && isOpen && (
            <Card>
              <CardContent>
                <div className="text-sm text-muted">Бюджет заказчика</div>
                <div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                  {formatMoney(job.budget)}
                </div>
                <div className="mt-5">
                  <ProposalForm jobId={job.id} alreadyApplied={alreadyApplied} />
                </div>
              </CardContent>
            </Card>
          )}

          {!session && isOpen && (
            <Card>
              <CardContent>
                <div className="text-sm text-muted">Бюджет заказчика</div>
                <div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                  {formatMoney(job.budget)}
                </div>
                <Link
                  href={`/login?callbackUrl=/jobs/${job.id}`}
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  Войти, чтобы откликнуться
                </Link>
                <p className="mt-3 text-center text-sm text-muted">
                  Нет аккаунта?{" "}
                  <Link href="/register" className="font-semibold text-accent-text hover:underline">
                    Зарегистрироваться
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          {session?.user.role === ROLES.CUSTOMER && !isOwner && (
            <Card>
              <CardContent>
                <div className="text-sm text-muted">Бюджет заказчика</div>
                <div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                  {formatMoney(job.budget)}
                </div>
                <p className="mt-4 text-sm text-muted">
                  Откликаться на заявки могут исполнители. Разместите свою задачу — специалисты откликнутся сами.
                </p>
                <Link
                  href="/jobs/new"
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  Создать заявку
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Customer info */}
          <Card>
            <CardContent>
              <h2 className="mb-4 text-sm font-bold text-foreground">Заказчик</h2>
              <div className="flex items-center gap-3">
                <Avatar name={job.customer.name} src={job.customer.avatarUrl} size={48} />
                <div className="min-w-0">
                  <div className="truncate font-bold text-foreground">{job.customer.name}</div>
                  {job.customer.city && (
                    <div className="flex items-center gap-1 text-sm text-muted">
                      <MapPin size={13} aria-hidden />
                      {job.customer.city}
                    </div>
                  )}
                </div>
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-muted">
                    <CalendarDays size={14} aria-hidden /> На площадке с
                  </dt>
                  <dd className="font-semibold text-foreground">{formatDate(job.customer.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-muted">
                    <Building2 size={14} aria-hidden /> Размещено заявок
                  </dt>
                  <dd className="font-semibold text-foreground">
                    {customerJobsCount} {plural(customerJobsCount, "заявка", "заявки", "заявок")}
                  </dd>
                </div>
              </dl>

              {session && !isOwner && (
                <div className="mt-4 border-t border-border pt-4">
                  <ReportButton targetType="JOB" targetId={job.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile sticky CTA — the primary action stays reachable while reading. */}
      {isExecutor && isOpen && !alreadyApplied && (
        <div className="fixed inset-x-0 bottom-[3.5rem] z-30 border-t border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <a
            href="#proposal-form"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground"
          >
            Откликнуться · {formatMoney(job.budget)}
          </a>
        </div>
      )}
    </div>
  );
}

function Term({
  icon: Icon,
  label,
  value,
  emphasis,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-card px-4 py-3.5">
      <dt className="flex items-center gap-1.5 text-xs text-muted">
        <Icon size={12} />
        {label}
      </dt>
      <dd
        className={
          emphasis
            ? "mt-1 truncate text-lg font-extrabold text-foreground"
            : "mt-1 truncate text-sm font-bold text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}

async function loadProposals(jobId: string) {
  return prisma.proposal.findMany({
    where: { jobId },
    include: {
      executor: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          city: true,
          phone: true,
          executorProfile: {
            select: {
              id: true,
              ratingAvg: true,
              ratingCount: true,
              completedOrders: true,
              headline: true,
              experienceYears: true,
            },
          },
        },
      },
    },
    // Pending first so the customer sees actionable proposals at the top.
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}
