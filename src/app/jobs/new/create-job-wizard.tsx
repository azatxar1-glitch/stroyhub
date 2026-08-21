"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { Category } from "@prisma/client";
import { ArrowLeft, ArrowRight, MapPin, Wifi, Send } from "lucide-react";
import { jobCreateSchema, type JobCreateInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/category-icon";
import { FileUploader, type UploadedFile } from "@/components/file-uploader";
import { formatMoney, cn } from "@/lib/utils";

type FormInput = z.input<typeof jobCreateSchema>;
type FieldName = keyof FormInput;

/** Each step declares which fields must validate before moving on. */
const STEPS: { title: string; caption: string; fields: FieldName[] }[] = [
  { title: "Что нужно сделать?", caption: "Название задачи и категория специалиста", fields: ["title", "categoryId"] },
  { title: "Описание", caption: "Объём работ, объект и требования", fields: ["description"] },
  { title: "Файлы", caption: "Чертежи, фото объекта, техзадание", fields: [] },
  { title: "Место работы", caption: "Удалённо или на объекте", fields: ["locationType", "city"] },
  { title: "Срок", caption: "Когда нужен результат", fields: [] },
  { title: "Бюджет", caption: "Ориентир по стоимости", fields: [] },
  { title: "Проверка", caption: "Убедитесь, что всё верно", fields: [] },
];

export function CreateJobWizard({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormInput, unknown, JobCreateInput>({
    resolver: zodResolver(jobCreateSchema),
    mode: "onTouched",
    defaultValues: { locationType: "ON_SITE", title: "", description: "", city: "", address: "", deadline: "" },
  });

  const values = watch();
  const isLast = step === STEPS.length - 1;
  const selectedCategory = categories.find((c) => c.id === values.categoryId);

  async function next() {
    const fields = STEPS[step].fields;
    if (fields.length > 0) {
      const ok = await trigger(fields);
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
        setServerError(body.error ?? "Не удалось опубликовать заявку");
        return;
      }
      router.push(`/jobs/${body.id}`);
      router.refresh();
    } catch {
      setServerError("Нет соединения с сервером. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepIndicator step={step} onJump={(i) => i < step && setStep(i)} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-7"
      >
        <div key={step} className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-text">
            Шаг {step + 1} из {STEPS.length}
          </p>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-foreground">{STEPS[step].title}</h2>
          <p className="mt-1 text-sm text-muted">{STEPS[step].caption}</p>

          <div className="mt-6">
            {/* ---------- 1. Title + category ---------- */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="title">Название задачи</Label>
                  <Input
                    id="title"
                    autoFocus
                    placeholder="Например: Подготовить исполнительную документацию по монолиту"
                    {...register("title")}
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                <div>
                  <Label>Категория специалиста</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map((c) => {
                      const active = values.categoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setValue("categoryId", c.id, { shouldValidate: true })}
                          aria-pressed={active}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
                            active
                              ? "border-accent bg-accent-soft"
                              : "border-border hover:border-border-strong hover:bg-surface"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              active ? "bg-accent text-accent-foreground" : "bg-surface text-muted"
                            )}
                          >
                            <CategoryIcon name={c.icon} size={15} />
                          </span>
                          <span className="min-w-0 text-xs font-semibold leading-tight text-foreground">
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" {...register("categoryId")} />
                  <FieldError message={errors.categoryId?.message} />
                </div>
              </div>
            )}

            {/* ---------- 2. Description ---------- */}
            {step === 1 && (
              <div>
                <Label htmlFor="description" hint="минимум 20 символов">
                  Опишите задачу
                </Label>
                <Textarea
                  id="description"
                  rows={9}
                  autoFocus
                  placeholder={
                    "Что нужно сделать, какой объект и площадь, какие материалы или ПО, что уже готово, что требуется от исполнителя."
                  }
                  {...register("description")}
                />
                <div className="mt-2 flex items-center justify-between">
                  <FieldError message={errors.description?.message} />
                  <span className="ml-auto text-xs text-faint">{values.description?.length ?? 0} симв.</span>
                </div>
              </div>
            )}

            {/* ---------- 3. Files ---------- */}
            {step === 2 && (
              <div>
                <FileUploader
                  value={attachments}
                  onChange={setAttachments}
                  hint="PDF, изображения, DWG, Word, Excel — до 15 МБ каждый"
                />
                <p className="mt-3 text-sm text-muted">
                  Необязательный шаг, но заявки с чертежами и фото получают заметно более точные отклики.
                </p>
              </div>
            )}

            {/* ---------- 4. Location ---------- */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <Label>Формат работы</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <FormatOption
                      active={values.locationType === "ON_SITE"}
                      onClick={() => setValue("locationType", "ON_SITE", { shouldValidate: true })}
                      icon={MapPin}
                      title="На объекте"
                      caption="Нужно присутствие"
                    />
                    <FormatOption
                      active={values.locationType === "REMOTE"}
                      onClick={() => setValue("locationType", "REMOTE", { shouldValidate: true })}
                      icon={Wifi}
                      title="Удалённо"
                      caption="Документы и расчёты"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="city">Город</Label>
                    <Input id="city" placeholder="Казань" {...register("city")} />
                    <FieldError message={errors.city?.message} />
                  </div>
                  {values.locationType === "ON_SITE" && (
                    <div>
                      <Label htmlFor="address" hint="необязательно">
                        Адрес или объект
                      </Label>
                      <Input id="address" placeholder="ЖК «Солнечный», корп. 2" {...register("address")} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------- 5. Deadline ---------- */}
            {step === 4 && (
              <div>
                <Label htmlFor="deadline" hint="необязательно">
                  Желаемый срок
                </Label>
                <Input id="deadline" autoFocus placeholder="Например: 10 дней" {...register("deadline")} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {["3 дня", "1 неделя", "2 недели", "1 месяц", "2 месяца"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setValue("deadline", preset)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        values.deadline === preset
                          ? "border-accent bg-accent-soft text-accent-text"
                          : "border-border text-muted hover:border-border-strong hover:text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---------- 6. Budget ---------- */}
            {step === 5 && (
              <div>
                <Label htmlFor="budget" hint="необязательно">
                  Ориентировочный бюджет, ₽
                </Label>
                <Input
                  id="budget"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  autoFocus
                  placeholder="45000"
                  {...register("budget")}
                />
                <FieldError message={errors.budget?.message} />
                <p className="mt-3 text-sm text-muted">
                  Если бюджет не указан, исполнители предложат свою цену — заявка останется с пометкой «Договорная».
                </p>
              </div>
            )}

            {/* ---------- 7. Review ---------- */}
            {step === 6 && (
              <div className="space-y-4">
                <ReviewRow label="Название" value={values.title} onEdit={() => setStep(0)} />
                <ReviewRow label="Категория" value={selectedCategory?.name} onEdit={() => setStep(0)} />
                <ReviewRow label="Описание" value={values.description} onEdit={() => setStep(1)} multiline />
                <ReviewRow
                  label="Файлы"
                  value={attachments.length ? attachments.map((a) => a.filename).join(", ") : "Не прикреплены"}
                  onEdit={() => setStep(2)}
                />
                <ReviewRow
                  label="Место работы"
                  value={
                    values.locationType === "REMOTE"
                      ? `Удалённо · ${values.city || "город не указан"}`
                      : [values.city, values.address].filter(Boolean).join(", ") || "Не указано"
                  }
                  onEdit={() => setStep(3)}
                />
                <ReviewRow label="Срок" value={values.deadline || "Не указан"} onEdit={() => setStep(4)} />
                <ReviewRow
                  label="Бюджет"
                  value={values.budget ? formatMoney(Number(values.budget)) : "Договорная"}
                  onEdit={() => setStep(5)}
                />
              </div>
            )}
          </div>
        </div>

        {serverError && (
          <p role="alert" className="mt-5 rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-text">
            {serverError}
          </p>
        )}

        {/* ---------- Navigation ---------- */}
        <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={back} className="gap-1.5">
              <ArrowLeft size={16} aria-hidden />
              Назад
            </Button>
          )}

          {isLast ? (
            <Button type="submit" size="lg" disabled={loading} className="ml-auto gap-2">
              <Send size={17} aria-hidden />
              {loading ? "Публикуем…" : "Опубликовать заявку"}
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={next} className="ml-auto gap-2">
              {STEPS[step].fields.length === 0 && step !== 0 ? "Продолжить" : "Далее"}
              <ArrowRight size={17} aria-hidden />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function StepIndicator({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Прогресс заполнения">
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={s.title} className="flex-1">
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={i >= step}
              aria-current={current ? "step" : undefined}
              aria-label={`Шаг ${i + 1}: ${s.title}`}
              className={cn(
                "flex h-1.5 w-full items-center rounded-full transition-colors",
                done && "cursor-pointer bg-accent hover:bg-accent-hover",
                current && "bg-accent",
                !done && !current && "bg-surface-strong"
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}

function FormatOption({
  active,
  onClick,
  icon: Icon,
  title,
  caption,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  caption: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong hover:bg-surface"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          active ? "bg-accent text-accent-foreground" : "bg-surface text-muted"
        )}
      >
        <Icon size={17} />
      </span>
      <span className="mt-3 block text-sm font-bold text-foreground">{title}</span>
      <span className="mt-0.5 block text-xs text-muted">{caption}</span>
    </button>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  multiline,
}: {
  label: string;
  value?: string | null;
  onEdit: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3.5">
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-faint">{label}</div>
        <div
          className={cn(
            "mt-1 text-sm text-foreground",
            multiline ? "line-clamp-3 whitespace-pre-wrap" : "truncate font-medium"
          )}
        >
          {value || "—"}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs font-bold text-accent-text hover:underline"
      >
        Изменить
      </button>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-danger-text">{message}</p>;
}
