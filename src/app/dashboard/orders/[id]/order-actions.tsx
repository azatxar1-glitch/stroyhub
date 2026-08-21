"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

export function OrderActions({ orderId, actions }: { orderId: string; actions: { status: OrderStatus; primary?: boolean }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function transition(status: OrderStatus) {
    setError(null);
    setLoading(status);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Не удалось изменить статус");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (actions.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.status}
            variant={a.primary ? "default" : "outline"}
            onClick={() => transition(a.status)}
            disabled={loading !== null}
            className={a.status === "CANCELLED" ? "text-danger hover:bg-danger-bg" : undefined}
          >
            {loading === a.status ? "Сохранение..." : ORDER_STATUS_LABELS[a.status]}
          </Button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
