"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Send } from "lucide-react";
import { proposalCreateSchema, type ProposalCreateInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

export function ProposalForm({ jobId, alreadyApplied }: { jobId: string; alreadyApplied: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(alreadyApplied);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof proposalCreateSchema>, unknown, ProposalCreateInput>({
    resolver: zodResolver(proposalCreateSchema),
  });

  async function onSubmit(data: ProposalCreateInput) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Не удалось отправить отклик");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setServerError("Нет соединения с сервером. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div id="proposal-form" className="rounded-xl border border-success-border bg-success-bg p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-success-text">
          <CheckCircle2 size={18} aria-hidden />
          Отклик отправлен
        </p>
        <p className="mt-1.5 text-sm text-muted">
          Заказчик увидит вашу цену и срок. Ответ придёт в уведомления и в чат.
        </p>
        <LinkButton href="/dashboard/proposals" variant="outline" size="sm" className="mt-3.5 w-full">
          Мои отклики
        </LinkButton>
      </div>
    );
  }

  if (!open) {
    return (
      <div id="proposal-form">
        <Button className="w-full gap-2" size="lg" onClick={() => setOpen(true)}>
          <Send size={17} aria-hidden />
          Откликнуться
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          Укажите свою цену и срок — заказчик сравнит предложения
        </p>
      </div>
    );
  }

  return (
    <form id="proposal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">Ваша цена, ₽</Label>
          <Input id="price" type="number" inputMode="numeric" placeholder="45000" {...register("price")} />
          {errors.price && (
            <p className="mt-1.5 text-xs font-medium text-danger-text">{errors.price.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="durationDays" hint="дней">
            Срок
          </Label>
          <Input
            id="durationDays"
            type="number"
            inputMode="numeric"
            placeholder="7"
            {...register("durationDays")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          rows={4}
          placeholder="Что именно сделаете, какой опыт с похожими задачами, что нужно от заказчика."
          {...register("comment")}
        />
        {errors.comment && (
          <p className="mt-1.5 text-xs font-medium text-danger-text">{errors.comment.message}</p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger-text">
          {serverError}
        </p>
      )}

      <div className="flex gap-2.5">
        <Button type="submit" className="flex-1 gap-2" disabled={loading}>
          {loading ? "Отправка…" : "Отправить отклик"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
