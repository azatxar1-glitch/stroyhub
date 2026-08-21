"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, MessageSquare, Star, Briefcase, ExternalLink, Inbox } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { VerifiedMark } from "@/components/trust-badges";
import { formatMoney, timeAgo } from "@/lib/utils";
import { plural } from "@/lib/trust";

export type ProposalData = {
  id: string;
  price: number;
  durationDays: number | null;
  comment: string;
  status: string;
  createdAt: string | Date;
  executor: {
    id: string;
    name: string;
    avatarUrl: string | null;
    city: string | null;
    phone?: string | null;
    executorProfile: {
      id: string;
      ratingAvg: number;
      ratingCount: number;
      completedOrders: number;
      headline: string;
      experienceYears?: number;
    } | null;
  };
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "На рассмотрении",
  ACCEPTED: "Выбран исполнителем",
  REJECTED: "Отклонён",
};
const STATUS_VARIANT: Record<string, "default" | "success" | "danger"> = {
  PENDING: "default",
  ACCEPTED: "success",
  REJECTED: "danger",
};

export function ProposalsManager({
  jobId,
  proposals,
  jobOpen,
}: {
  jobId: string;
  proposals: ProposalData[];
  jobOpen: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "accept" | "reject") {
    if (action === "accept" && !confirm("Выбрать этого исполнителя? Заявка перейдёт в работу, остальные отклики будут отклонены.")) {
      return;
    }
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Не удалось выполнить действие");
        return;
      }
      router.refresh();
    } catch {
      setError("Нет соединения с сервером. Попробуйте ещё раз.");
    } finally {
      setBusyId(null);
    }
  }

  async function startChat(executorId: string) {
    setError(null);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: executorId, jobId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Не удалось открыть чат");
        return;
      }
      router.push(`/messages/${body.id}`);
    } catch {
      setError("Нет соединения с сервером. Попробуйте ещё раз.");
    }
  }

  if (proposals.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Пока нет откликов"
        description="Как только специалисты откликнутся, вы увидите здесь их цену, срок и профиль — и сможете выбрать исполнителя."
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-text">
          {error}
        </p>
      )}

      {proposals.map((p) => {
        const profile = p.executor.executorProfile;
        const isBusy = busyId === p.id;

        return (
          <article
            key={p.id}
            className={`rounded-2xl border p-5 transition-colors ${
              p.status === "ACCEPTED" ? "border-success bg-success-bg/40" : "border-border bg-card"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3.5">
                <Avatar name={p.executor.name} src={p.executor.avatarUrl} size={48} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">{p.executor.name}</span>
                    {profile && (
                      <VerifiedMark
                        input={{
                          ratingAvg: profile.ratingAvg,
                          ratingCount: profile.ratingCount,
                          completedOrders: profile.completedOrders,
                        }}
                      />
                    )}
                  </div>
                  {profile && <p className="mt-0.5 truncate text-sm text-muted">{profile.headline}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {profile && profile.ratingCount > 0 ? (
                      <span className="flex items-center gap-1">
                        <Star size={13} className="fill-accent text-accent" aria-hidden />
                        <span className="font-semibold text-foreground">{profile.ratingAvg.toFixed(1)}</span>
                        <span className="text-muted">({profile.ratingCount})</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted">Без отзывов</span>
                    )}
                    {profile && profile.completedOrders > 0 && (
                      <span className="text-muted">
                        {profile.completedOrders} {plural(profile.completedOrders, "заказ", "заказа", "заказов")}
                      </span>
                    )}
                    {profile?.experienceYears ? (
                      <span className="flex items-center gap-1 text-muted">
                        <Briefcase size={13} aria-hidden />
                        {profile.experienceYears} {plural(profile.experienceYears, "год", "года", "лет")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <Badge variant={STATUS_VARIANT[p.status] ?? "default"}>{STATUS_LABEL[p.status] ?? p.status}</Badge>
            </div>

            {/* Commercial terms are what the customer compares — give them weight. */}
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface px-4 py-3 sm:max-w-md">
              <div>
                <dt className="text-xs text-muted">Цена</dt>
                <dd className="mt-0.5 text-lg font-extrabold text-foreground">{formatMoney(p.price)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Срок выполнения</dt>
                <dd className="mt-0.5 text-lg font-extrabold text-foreground">
                  {p.durationDays ? `${p.durationDays} дн.` : "Обсуждается"}
                </dd>
              </div>
            </dl>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{p.comment}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
              {jobOpen && p.status === "PENDING" && (
                <Button size="sm" onClick={() => act(p.id, "accept")} disabled={isBusy} className="gap-1.5">
                  <Check size={15} aria-hidden />
                  {isBusy ? "Сохраняем…" : "Выбрать исполнителя"}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => startChat(p.executor.id)} className="gap-1.5">
                <MessageSquare size={15} aria-hidden /> Написать
              </Button>
              {profile && (
                <Link
                  href={`/executors/${profile.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  <ExternalLink size={15} aria-hidden /> Открыть профиль
                </Link>
              )}
              {jobOpen && p.status === "PENDING" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => act(p.id, "reject")}
                  disabled={isBusy}
                  className="ml-auto gap-1.5 text-muted hover:text-danger-text"
                >
                  <X size={15} aria-hidden /> Отклонить
                </Button>
              )}
              <span className="ml-auto text-xs text-muted sm:ml-0">{timeAgo(p.createdAt)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
