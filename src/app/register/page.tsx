"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Search, Briefcase, Check } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CUSTOMER" },
  });

  const role = watch("role");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Ошибка регистрации");
        return;
      }
      const signInRes = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (signInRes?.error) {
        router.push("/login");
        return;
      }
      router.push(data.role === "CUSTOMER" ? "/jobs/new" : "/dashboard/profile");
      router.refresh();
    } catch {
      setServerError("Нет соединения с сервером. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex items-center justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">Создать аккаунт</h1>
          <p className="mt-2 text-sm text-muted">Бесплатно, занимает меньше минуты</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <fieldset className="border-0 p-0">
            <legend className="mb-2 text-sm font-semibold text-foreground">Я хочу</legend>
            <div className="grid grid-cols-2 gap-3">
              <RoleOption
                active={role === "CUSTOMER"}
                onClick={() => setValue("role", "CUSTOMER")}
                icon={Search}
                title="Найти исполнителя"
                caption="Размещать заявки"
              />
              <RoleOption
                active={role === "EXECUTOR"}
                onClick={() => setValue("role", "EXECUTOR")}
                icon={Briefcase}
                title="Оказывать услуги"
                caption="Откликаться на заявки"
              />
            </div>
          </fieldset>

          <div>
            <Label htmlFor="name">Имя или название компании</Label>
            <Input id="name" autoComplete="name" placeholder="Иван Строй" {...register("name")} />
            {errors.name && <p className="mt-1.5 text-xs font-medium text-danger-text">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && <p className="mt-1.5 text-xs font-medium text-danger-text">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password" hint="минимум 6 символов">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs font-medium text-danger-text">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-text">
              {serverError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
          </Button>

          <p className="text-center text-sm text-muted">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold text-accent-text hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function RoleOption({
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
        "relative rounded-xl border p-4 text-left transition-colors",
        active ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong hover:bg-surface"
      )}
    >
      {active && (
        <span className="absolute right-2.5 top-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check size={11} strokeWidth={3} aria-hidden />
        </span>
      )}
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          active ? "bg-accent text-accent-foreground" : "bg-surface text-muted"
        )}
      >
        <Icon size={17} />
      </span>
      <span className="mt-3 block text-sm font-bold leading-tight text-foreground">{title}</span>
      <span className="mt-0.5 block text-xs text-muted">{caption}</span>
    </button>
  );
}
