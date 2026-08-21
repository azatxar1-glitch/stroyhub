"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { jobCreateSchema, type JobCreateInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Job, Category } from "@prisma/client";

export function EditJobForm({ job, categories }: { job: Job; categories: Category[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof jobCreateSchema>, unknown, JobCreateInput>({
    resolver: zodResolver(jobCreateSchema),
    defaultValues: {
      title: job.title,
      categoryId: job.categoryId,
      description: job.description,
      city: job.city,
      address: job.address ?? "",
      locationType: job.locationType as "REMOTE" | "ON_SITE",
      budget: job.budget ?? undefined,
      deadline: job.deadline ?? "",
    },
  });

  const locationType = watch("locationType");

  async function onSubmit(data: JobCreateInput) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Не удалось сохранить изменения");
        return;
      }
      router.push(`/jobs/${job.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
      <div>
        <Label htmlFor="title">Название задачи</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="mt-1 text-sm text-danger-text">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="categoryId">Категория специалиста</Label>
        <Select id="categoryId" {...register("categoryId")}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        {errors.categoryId && <p className="mt-1 text-sm text-danger-text">{errors.categoryId.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Описание задачи</Label>
        <Textarea id="description" rows={6} {...register("description")} />
        {errors.description && <p className="mt-1 text-sm text-danger-text">{errors.description.message}</p>}
      </div>

      <div>
        <Label>Формат работы</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue("locationType", "ON_SITE")}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
              locationType === "ON_SITE" ? "border-accent bg-accent-soft text-accent-text" : "border-border hover:bg-surface"
            )}
          >
            На объекте
          </button>
          <button
            type="button"
            onClick={() => setValue("locationType", "REMOTE")}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
              locationType === "REMOTE" ? "border-accent bg-accent-soft text-accent-text" : "border-border hover:bg-surface"
            )}
          >
            Удалённо
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">Город</Label>
          <Input id="city" {...register("city")} />
          {errors.city && <p className="mt-1 text-sm text-danger-text">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="address">Адрес / объект</Label>
          <Input id="address" {...register("address")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="budget">Бюджет, ₽</Label>
          <Input id="budget" type="number" {...register("budget")} />
        </div>
        <div>
          <Label htmlFor="deadline">Срок выполнения</Label>
          <Input id="deadline" {...register("deadline")} />
        </div>
      </div>

      {serverError && <p className="text-sm text-danger-text">{serverError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>
    </form>
  );
}
