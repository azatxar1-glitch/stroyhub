import Link from "next/link";
import { Send, Clock, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, timeAgo } from "@/lib/utils";
import { plural } from "@/lib/trust";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; variant: "default" | "success" | "danger" }> = {
  PENDING: { label: "На рассмотрении", variant: "default" },
  ACCEPTED: { label: "Принят", variant: "success" },
  REJECTED: { label: "Отклонён", variant: "danger" },
};

export default async function MyProposalsPage() {
  const session = await auth();
  const proposals = await prisma.proposal.findMany({
    where: { executorId: session!.user.id },
    include: { job: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pending = proposals.filter((p) => p.status === "PENDING").length;
  const accepted = proposals.filter((p) => p.status === "ACCEPTED").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Мои отклики</h1>
          <p className="mt-1.5 text-muted">
            {proposals.length > 0
              ? `${pending} на рассмотрении · ${accepted} принято`
              : "Заявки, на которые вы откликнулись"}
          </p>
        </div>
        <LinkButton href="/jobs">Найти заявки</LinkButton>
      </header>

      {proposals.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Вы ещё не откликались на заявки"
          description="Посмотрите ленту заявок и отправьте отклик со своей ценой и сроком — заказчик увидит его сразу."
          action={<LinkButton href="/jobs">Смотреть заявки</LinkButton>}
        />
      ) : (
        <ul className="space-y-3.5">
          {proposals.map((p) => {
            const status = STATUS[p.status] ?? STATUS.PENDING;
            return (
              <li key={p.id}>
                <article className="group relative rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_8px_24px_-12px_rgb(17_24_39/0.18)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default">
                          <CategoryIcon name={p.job.category.icon} size={13} />
                          {p.job.category.name}
                        </Badge>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <h2 className="mt-2.5 text-base font-bold leading-snug text-foreground">
                        <Link href={`/jobs/${p.jobId}`} className="after:absolute after:inset-0 focus:outline-none">
                          {p.job.title}
                        </Link>
                      </h2>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3.5 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <Wallet size={14} aria-hidden />
                      Ваша цена:{" "}
                      <span className="font-bold text-foreground">{formatMoney(p.price)}</span>
                    </span>
                    {p.durationDays && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} aria-hidden />
                        {p.durationDays} {plural(p.durationDays, "день", "дня", "дней")}
                      </span>
                    )}
                    <span className="ml-auto text-xs">{timeAgo(p.createdAt)}</span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
