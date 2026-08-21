import Link from "next/link";
import { FileText, Users, Clock, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { JobStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { formatMoney, timeAgo } from "@/lib/utils";
import { plural } from "@/lib/trust";

export const dynamic = "force-dynamic";

export default async function MyJobsPage() {
  const session = await auth();
  const jobs = await prisma.job.findMany({
    where: { customerId: session!.user.id },
    include: { category: true, _count: { select: { proposals: true } } },
    orderBy: { createdAt: "desc" },
  });

  const open = jobs.filter((j) => j.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Мои заявки</h1>
          <p className="mt-1.5 text-muted">
            {jobs.length > 0
              ? `${jobs.length} ${plural(jobs.length, "заявка", "заявки", "заявок")}, из них ${open} открытых`
              : "Все размещённые вами задачи"}
          </p>
        </div>
        <LinkButton href="/jobs/new">Создать заявку</LinkButton>
      </header>

      {jobs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Пока нет заявок"
          description="Создайте первую заявку — специалисты смогут откликнуться со своей ценой и сроком."
          action={<LinkButton href="/jobs/new">Создать заявку</LinkButton>}
          secondaryAction={
            <LinkButton href="/executors" variant="outline">
              Посмотреть исполнителей
            </LinkButton>
          }
        />
      ) : (
        <ul className="space-y-3.5">
          {jobs.map((job) => (
            <li key={job.id}>
              <article className="group relative rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_8px_24px_-12px_rgb(17_24_39/0.18)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default">
                        <CategoryIcon name={job.category.icon} size={13} />
                        {job.category.name}
                      </Badge>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <h2 className="mt-2.5 text-base font-bold leading-snug text-foreground">
                      <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0 focus:outline-none">
                        {job.title}
                      </Link>
                    </h2>
                  </div>

                  {job._count.proposals > 0 && job.status === "OPEN" && (
                    <span className="relative z-10 flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-bold text-accent-text">
                      <Users size={14} aria-hidden />
                      {job._count.proposals} {plural(job._count.proposals, "отклик", "отклика", "откликов")}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3.5 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <Wallet size={14} aria-hidden />
                    {formatMoney(job.budget)}
                  </span>
                  {job.deadline && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} aria-hidden />
                      {job.deadline}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users size={14} aria-hidden />
                    {job._count.proposals} {plural(job._count.proposals, "отклик", "отклика", "откликов")}
                  </span>
                  <span className="ml-auto text-xs">{timeAgo(job.createdAt)}</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
