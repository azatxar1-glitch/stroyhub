"use client";

import { useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Сбор контактов, пока в направлении нет ни исполнителей, ни заявок.
 *
 * На старте у маркетплейса нет ни одной стороны, и пустая категория —
 * тупик. Форма превращает её в точку входа: человек оставляет адрес и
 * возвращается, когда появится смысл.
 */
export function CategoryLead({
  categorySlug,
  categoryName,
}: {
  categorySlug: string;
  categoryName: string;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Введите корректный email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/category-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, categorySlug }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Не удалось сохранить адрес");
        return;
      }
      setDone(true);
    } catch {
      setError("Нет соединения с сервером. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-2.5 rounded-xl bg-success-bg px-4 py-3.5 text-sm font-medium text-success-text">
        <CheckCircle2 size={18} aria-hidden />
        Сообщим, когда появятся заявки по направлению «{categoryName}».
      </p>
    );
  }

  return (
    <form onSubmit={submit}>
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BellRing size={16} className="text-muted" aria-hidden />
        Вы специалист по направлению «{categoryName}»?
      </p>
      <p className="mt-1.5 text-sm text-muted">
        Оставьте адрес — напишем, когда появятся подходящие заявки.
      </p>

      <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email для уведомления о заявках"
          className="sm:max-w-xs"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Сохраняем…" : "Уведомить меня"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger-text">
          {error}
        </p>
      )}
    </form>
  );
}
