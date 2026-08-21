import Link from "next/link";
import { FileText, MessageSquareText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { JobStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { formatMoney, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyJobsPage() {
  const session = await auth();
  const jobs = await prisma.job.findMany({
    where: { customerId: session!.user.id },
    include: { category: true, _count: { select: { proposals: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Мои заявки</h1>
          <p className="mt-1 text-muted">Все размещённые вами заявки</p>
        </div>
        <LinkButton href="/jobs/new" variant="accent">
          Новая заявка
        </LinkButton>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="У вас пока нет заявок"
          description="Разместите первую заявку, чтобы найти исполнителя"
          action={
            <LinkButton href="/jobs/new" variant="accent">
              Разместить заявку
            </LinkButton>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Заявка</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Бюджет</th>
                <th className="px-4 py-3 font-medium">Отклики</th>
                <th className="px-4 py-3 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-foreground hover:text-primary">
                      {job.title}
                    </Link>
                    <div className="text-xs text-muted">{job.category.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-foreground">{formatMoney(job.budget)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="flex items-center gap-1 text-primary hover:underline">
                      <MessageSquareText size={14} /> {job._count.proposals}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
