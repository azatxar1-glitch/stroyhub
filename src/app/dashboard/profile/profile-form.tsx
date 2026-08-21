"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import type { User } from "@prisma/client";
import { userProfileSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { CheckCircle2 } from "lucide-react";

type ProfileInput = z.infer<typeof userProfileSchema>;

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const { update } = useSession();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? "",
      city: user.city ?? "",
      bio: user.bio ?? "",
    },
  });

  async function handleAvatarChange(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) setAvatarUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: ProfileInput) {
    setServerError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, avatarUrl }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Не удалось сохранить");
        return;
      }
      await update();
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={avatarUrl} size={64} />
        <label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface">
          {uploading ? "Загрузка..." : "Изменить фото"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Имя</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" placeholder="+7 900 000-00-00" {...register("phone")} />
        </div>
      </div>

      <div>
        <Label htmlFor="city">Город</Label>
        <Input id="city" placeholder="Казань" {...register("city")} />
      </div>

      <div>
        <Label htmlFor="bio">О себе</Label>
        <Textarea id="bio" rows={4} placeholder="Расскажите о своём опыте..." {...register("bio")} />
      </div>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}
      {saved && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 size={15} /> Сохранено
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
