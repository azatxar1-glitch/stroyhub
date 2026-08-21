"use client";

import { useState } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReportButton({ targetType, targetId }: { targetType: "USER" | "JOB"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (reason.trim().length < 5) {
      setError("Опишите причину подробнее");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Не удалось отправить жалобу");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-danger-text"
      >
        <Flag size={13} /> Пожаловаться
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Пожаловаться">
        {done ? (
          <div className="flex items-center gap-2 rounded-md bg-success-bg px-4 py-3 text-sm text-success-text">
            <CheckCircle2 size={18} />
            Жалоба отправлена. Мы её рассмотрим.
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              rows={4}
              placeholder="Опишите, что произошло..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {error && <p className="text-sm text-danger-text">{error}</p>}
            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? "Отправка..." : "Отправить жалобу"}
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}
