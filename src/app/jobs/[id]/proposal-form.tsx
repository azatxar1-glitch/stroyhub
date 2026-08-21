"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { proposalCreateSchema, type ProposalCreateInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

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
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
        <CheckCircle2 size={18} />
        Вы откликнулись на эту заявку
      </div>
    );
  }

  if (!open) {
    return (
      <Button className="w-full" onClick={() => setOpen(true)}>
        Откликнуться
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">Цена, ₽</Label>
          <Input id="price" type="number" placeholder="45000" {...register("price")} />
          {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
        </div>
        <div>
          <Label htmlFor="durationDays">Срок, дн.</Label>
          <Input id="durationDays" type="number" placeholder="7" {...register("durationDays")} />
        </div>
      </div>
      <div>
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea id="comment" rows={3} placeholder="Готов выполнить работу за 40 000 ₽. Срок — 7 дней." {...register("comment")} />
        {errors.comment && <p className="mt-1 text-xs text-danger">{errors.comment.message}</p>}
      </div>
      {serverError && <p className="text-sm text-danger">{serverError}</p>}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Отправка..." : "Отправить отклик"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
