"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, X } from "lucide-react";
import type { z } from "zod";
import { executorProfileSchema, type ExecutorProfileInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Category, ExecutorProfile, ExecutorSkill, Skill } from "@prisma/client";

type ProfileWithSkills = (ExecutorProfile & { skills: (ExecutorSkill & { skill: Skill })[] }) | null;

export function ExecutorProfileForm({ profile, categories }: { profile: ProfileWithSkills; categories: Category[] }) {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>(profile?.skills.map((s) => s.skill.name) ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof executorProfileSchema>, unknown, ExecutorProfileInput>({
    resolver: zodResolver(executorProfileSchema),
    defaultValues: {
      categoryId: profile?.categoryId ?? "",
      headline: profile?.headline ?? "",
      description: profile?.description ?? "",
      experienceYears: profile?.experienceYears ?? 0,
      remoteAvailable: profile?.remoteAvailable ?? false,
      priceFrom: profile?.priceFrom ?? undefined,
      availability: (profile?.availability as "AVAILABLE" | "BUSY") ?? "AVAILABLE",
    },
  });

  function addSkill() {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillInput("");
  }

  async function onSubmit(data: ExecutorProfileInput) {
    setServerError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/executors/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, skillNames: skills }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Не удалось сохранить профиль");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Специализация</Label>
          <Select id="categoryId" {...register("categoryId")}>
            <option value="">Выберите категорию</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {errors.categoryId && <p className="mt-1 text-sm text-danger-text">{errors.categoryId.message}</p>}
        </div>
        <div>
          <Label htmlFor="experienceYears">Опыт, лет</Label>
          <Input id="experienceYears" type="number" {...register("experienceYears")} />
        </div>
      </div>

      <div>
        <Label htmlFor="headline">Заголовок профиля</Label>
        <Input id="headline" placeholder="Инженер ПТО с опытом сдачи объектов «под ключ»" {...register("headline")} />
        {errors.headline && <p className="mt-1 text-sm text-danger-text">{errors.headline.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" rows={4} placeholder="Расскажите о своём опыте и подходе к работе..." {...register("description")} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="priceFrom">Стоимость от, ₽</Label>
          <Input id="priceFrom" type="number" placeholder="15000" {...register("priceFrom")} />
        </div>
        <div>
          <Label htmlFor="availability">Доступность</Label>
          <Select id="availability" {...register("availability")}>
            <option value="AVAILABLE">Свободен</option>
            <option value="BUSY">Занят</option>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("remoteAvailable")} />
        Готов работать удалённо
      </label>

      <div>
        <Label>Навыки</Label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Например: AutoCAD"
          />
          <Button type="button" variant="outline" onClick={addSkill}>
            Добавить
          </Button>
        </div>
        {skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-muted hover:text-danger-text">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {serverError && <p className="text-sm text-danger-text">{serverError}</p>}
      {saved && (
        <p className="flex items-center gap-1.5 text-sm text-success-text">
          <CheckCircle2 size={15} /> Профиль сохранён
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Сохранение..." : "Сохранить профиль"}
      </Button>
    </form>
  );
}
