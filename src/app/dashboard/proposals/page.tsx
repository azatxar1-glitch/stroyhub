import Link from "next/link";
import { Send } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { formatMoney, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "На рассмотрении",
  ACCEPTED: "Принят",
  REJECTED: "Отклонён",
};
const STATUS_VARIANT: Record<string, "default" | "success" | "danger"> = {
  PENDING: "default",
  ACCEPTED: "success",
  REJECTED: "danger",
};

export default async function MyProposalsPage() {
  const session = await auth();
  const proposals = await prisma.proposal.findMany({
    where: { executorId: session!.user.id },
    include: { job: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Мои отклики</h1>
        <p className="mt-1 text-muted">Заявки, на которые вы откликнулись</p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Вы ещё не откликались на заявки"
          description="Посмотрите ленту заявок и найдите подходящую задачу"
          action={
            <LinkButton href="/jobs" variant="accent">
              Смотреть заявки
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <Link
              key={p.id}
              href={`/jobs/${p.jobId}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 hover:shadow-md"
            >
              <div>
                <div className="font-medium text-foreground">{p.job.title}</div>
                <div className="text-xs text-muted">
                  {p.job.category.name} · Ваша цена: {formatMoney(p.price)} · {formatDate(p.createdAt)}
                </div>
              </div>
              <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
