import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock, Paperclip, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { JobStatusBadge } from "@/components/status-badge";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, formatDate } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { ProposalForm } from "./proposal-form";
import { ProposalsManager } from "./proposals-manager";
import { JobOwnerActions } from "./job-owner-actions";
import { ReportButton } from "@/components/report-button";

export const dynamic = "force-dynamic";

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

  return (
    <div className="container-page max-w-5xl py-10">
      <Link href="/jobs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Все заявки
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="primary" className="gap-1.5">
                  <CategoryIcon name={job.category.icon} size={14} />
                  {job.category.name}
                </Badge>
                <JobStatusBadge status={job.status} />
              </div>

              <h1 className="mt-4 text-2xl font-bold text-foreground">{job.title}</h1>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} />
                  {job.locationType === "REMOTE" ? "Удалённо" : `${job.city}${job.address ? `, ${job.address}` : ""}`}
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} />
                    {job.deadline}
                  </span>
                )}
                <span>Опубликовано {formatDate(job.createdAt)}</span>
              </div>

              <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{job.description}</div>

              {job.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Файлы</h3>
                  <ul className="space-y-1.5">
                    {job.attachments.map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-fit items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-surface"
                        >
                          <Paperclip size={14} className="text-muted" />
                          {a.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(isOwner || isAdmin) && (
                <div className="mt-6 border-t border-border pt-4">
                  <JobOwnerActions jobId={job.id} status={job.status} />
                </div>
              )}
            </CardContent>
          </Card>

          {(isOwner || isAdmin) && (
            <Card>
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Отклики <span className="text-muted">({proposals.length})</span>
                </h2>
                <ProposalsManager jobId={job.id} proposals={proposals} jobOpen={job.status === "OPEN"} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Бюджет</span>
                <span className="font-semibold text-primary">{formatMoney(job.budget)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Срок</span>
                <span className="font-medium text-foreground">{job.deadline || "Не указан"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Город</span>
                <span className="font-medium text-foreground">{job.city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Откликов</span>
                <span className="font-medium text-foreground">{job._count.proposals}</span>
              </div>

              {isExecutor && job.status === "OPEN" && (
                <div className="border-t border-border pt-4">
                  <ProposalForm jobId={job.id} alreadyApplied={alreadyApplied} />
                </div>
              )}
              {!session && job.status === "OPEN" && (
                <Link
                  href={`/login?callbackUrl=/jobs/${job.id}`}
                  className="block w-full rounded-md bg-primary py-2.5 text-center text-sm font-medium text-white hover:bg-primary/90"
                >
                  Войти, чтобы откликнуться
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Заказчик</h3>
              <div className="flex items-center gap-3">
                <Avatar name={job.customer.name} src={job.customer.avatarUrl} size={44} />
                <div>
                  <div className="font-medium text-foreground">{job.customer.name}</div>
                  <div className="text-xs text-muted">На сервисе с {formatDate(job.customer.createdAt)}</div>
                </div>
              </div>
              {session && !isOwner && (
                <div className="mt-4">
                  <ReportButton targetType="JOB" targetId={job.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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
          executorProfile: { select: { id: true, ratingAvg: true, ratingCount: true, completedOrders: true, headline: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
