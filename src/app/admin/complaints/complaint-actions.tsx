"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export function ComplaintActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(status: "RESOLVED" | "DISMISSED") {
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setStatus("RESOLVED")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-success-text hover:bg-success-bg"
      >
        <Check size={13} /> Решено
      </button>
      <button
        onClick={() => setStatus("DISMISSED")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface"
      >
        <X size={13} /> Отклонить
      </button>
    </div>
  );
}
