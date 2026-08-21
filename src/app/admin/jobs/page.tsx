import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { JobStatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/utils";
import { JobDeleteButton } from "./job-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, customer: { select: { name: true, email: true } }, _count: { select: { proposals: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Заявки</h1>
        <p className="mt-1 text-muted">Всего: {jobs.length}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-border bg-surface text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Заявка</th>
              <th className="px-4 py-3 font-medium">Заказчик</th>
              <th className="px-4 py-3 font-medium">Бюджет</th>
              <th className="px-4 py-3 font-medium">Отклики</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3">
                  <Link href={`/jobs/${j.id}`} className="font-medium text-foreground hover:text-primary">
                    {j.title}
                  </Link>
                  <div className="text-xs text-muted">{j.category.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{j.customer.name}</div>
                  <div className="text-xs text-muted">{j.customer.email}</div>
                </td>
                <td className="px-4 py-3 text-foreground">{formatMoney(j.budget)}</td>
                <td className="px-4 py-3 text-muted">{j._count.proposals}</td>
                <td className="px-4 py-3">
                  <JobStatusBadge status={j.status} />
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(j.createdAt)}</td>
                <td className="px-4 py-3">
                  <JobDeleteButton jobId={j.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
