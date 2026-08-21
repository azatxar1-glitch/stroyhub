"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { formatMoney, timeAgo } from "@/lib/utils";

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
    executorProfile: { id: string; ratingAvg: number; ratingCount: number; completedOrders: number; headline: string } | null;
  };
};

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

export function ProposalsManager({ jobId, proposals, jobOpen }: { jobId: string; proposals: ProposalData[]; jobOpen: boolean }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "accept" | "reject") {
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
    } finally {
      setBusyId(null);
    }
  }

  async function startChat(executorId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: executorId, jobId }),
    });
    const body = await res.json();
    if (res.ok) router.push(`/messages/${body.id}`);
  }

  if (proposals.length === 0) {
    return <p className="text-sm text-muted">Пока нет откликов на эту заявку.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-danger">{error}</p>}
      {proposals.map((p) => (
        <div key={p.id} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            {p.executor.executorProfile ? (
              <Link href={`/executors/${p.executor.executorProfile.id}`} className="flex items-center gap-3">
                <Avatar name={p.executor.name} src={p.executor.avatarUrl} size={40} />
                <div>
                  <div className="font-semibold text-foreground">{p.executor.name}</div>
                  <RatingStars value={p.executor.executorProfile.ratingAvg} count={p.executor.executorProfile.ratingCount} size={12} />
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar name={p.executor.name} src={p.executor.avatarUrl} size={40} />
                <div className="font-semibold text-foreground">{p.executor.name}</div>
              </div>
            )}
            <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
          </div>

          <p className="mt-3 text-sm text-foreground">{p.comment}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="font-semibold text-primary">{formatMoney(p.price)}</span>
            {p.durationDays && <span className="text-muted">Срок: {p.durationDays} дн.</span>}
            <span className="text-xs text-muted">{timeAgo(p.createdAt)}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => startChat(p.executor.id)} className="gap-1.5">
              <MessageSquare size={14} /> Написать
            </Button>
            {jobOpen && p.status === "PENDING" && (
              <>
                <Button size="sm" onClick={() => act(p.id, "accept")} disabled={busyId === p.id} className="gap-1.5">
                  <Check size={14} /> Выбрать исполнителя
                </Button>
                <Button size="sm" variant="outline" onClick={() => act(p.id, "reject")} disabled={busyId === p.id} className="gap-1.5">
                  <X size={14} /> Отклонить
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
