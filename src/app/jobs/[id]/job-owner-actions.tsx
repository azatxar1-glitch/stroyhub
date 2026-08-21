"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JobOwnerActions({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function closeJob() {
    if (!confirm("Закрыть заявку? Она перестанет быть доступна для откликов.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status !== "OPEN") return null;

  return (
    // Wraps instead of overflowing once the two labels no longer fit side by side.
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/jobs/${jobId}/edit`}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
      >
        <Pencil size={14} aria-hidden /> Редактировать
      </Link>
      <Button
        size="sm"
        variant="outline"
        onClick={closeJob}
        disabled={loading}
        className="gap-1.5 text-danger-text hover:border-danger/30 hover:bg-danger-bg"
      >
        <XCircle size={14} aria-hidden /> {loading ? "Закрываем…" : "Закрыть заявку"}
      </Button>
    </div>
  );
}
