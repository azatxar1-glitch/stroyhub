"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { jobCreateSchema, type JobCreateInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileUploader, type UploadedFile } from "@/components/file-uploader";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export default function NewJobPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<z.input<typeof jobCreateSchema>, unknown, JobCreateInput>({
    resolver: zodResolver(jobCreateSchema),
    defaultValues: { locationType: "ON_SITE" },
  });

  const locationType = watch("locationType");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  async function onSubmit(data: JobCreateInput) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, attachmentUrls: attachments }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Не удалось создать заявку");
        return;
      }
      router.push(`/jobs/${body.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-foreground">Разместить заявку</h1>
      <p className="mt-1 text-muted">Опишите задачу — исполнители откликнутся со своими предложениями</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div>
          <Label htmlFor="title">Название задачи</Label>
          <Input id="title" placeholder="Например: Подготовка исполнительной документации" {...register("title")} />
          {errors.title && <p className="mt-1 text-sm text-danger">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="categoryId">Категория специалиста</Label>
          <Select id="categoryId" {...register("categoryId")}>
            <option value="">Выберите категорию</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {errors.categoryId && <p className="mt-1 text-sm text-danger">{errors.categoryId.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Описание задачи</Label>
          <Textarea
            id="description"
            rows={6}
            placeholder="Опишите объём работ, объект, требования к исполнителю..."
            {...register("description")}
          />
          {errors.description && <p className="mt-1 text-sm text-danger">{errors.description.message}</p>}
        </div>

        <div>
          <Label>Формат работы</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("locationType", "ON_SITE")}
              className={cn(
                "rounded-md border-2 px-3 py-2.5 text-sm font-medium transition-colors",
                locationType === "ON_SITE" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-surface"
              )}
            >
              На объекте
            </button>
            <button
              type="button"
              onClick={() => setValue("locationType", "REMOTE")}
              className={cn(
                "rounded-md border-2 px-3 py-2.5 text-sm font-medium transition-colors",
                locationType === "REMOTE" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-surface"
              )}
            >
              Удалённо
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="city">Город</Label>
            <Input id="city" placeholder="Казань" {...register("city")} />
            {errors.city && <p className="mt-1 text-sm text-danger">{errors.city.message}</p>}
          </div>
          <div>
            <Label htmlFor="address">Адрес / объект</Label>
            <Input id="address" placeholder="ЖК «Солнечный», корп. 2" {...register("address")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="budget">Бюджет, ₽</Label>
            <Input id="budget" type="number" placeholder="45000" {...register("budget")} />
          </div>
          <div>
            <Label htmlFor="deadline">Срок выполнения</Label>
            <Input id="deadline" placeholder="10 дней" {...register("deadline")} />
          </div>
        </div>

        <div>
          <Label>Файлы и фотографии</Label>
          <Controller
            name="attachmentUrls"
            control={control}
            render={() => (
              <FileUploader value={attachments} onChange={setAttachments} hint="Чертежи, фото объекта, техзадание" />
            )}
          />
        </div>

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Публикация..." : "Опубликовать заявку"}
        </Button>
      </form>
    </div>
  );
}
