"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle } from "lucide-react";

export function UserBlockToggle({ userId, isBlocked, isAdmin }: { userId: string; isBlocked: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isAdmin) return <span className="text-xs text-muted">—</span>;

  async function toggle() {
    const confirmMsg = isBlocked ? "Разблокировать пользователя?" : "Заблокировать пользователя?";
    if (!confirm(confirmMsg)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={
        isBlocked
          ? "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success-bg"
          : "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-bg"
      }
    >
      {isBlocked ? <CheckCircle size={13} /> : <Ban size={13} />}
      {isBlocked ? "Разблокировать" : "Заблокировать"}
    </button>
  );
}
