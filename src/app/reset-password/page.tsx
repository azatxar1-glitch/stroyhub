"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, LinkIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { PasswordStrength } from "@/components/password-strength";
import { MIN_PASSWORD_LENGTH, checkPassword } from "@/lib/password";

const schema = z
  .object({
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Минимум ${MIN_PASSWORD_LENGTH} символов`)
      .refine((v) => checkPassword(v).score > 0, {
        message: "Такой пароль слишком простой — придумайте другой",
      }),
    confirm: z.string().min(1, "Повторите пароль"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Пароли не совпадают",
    path: ["confirm"],
  });

type FormInput = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormInput) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Не удалось сменить пароль");
        return;
      }
      setDone(true);
      // Даём прочитать подтверждение, потом отправляем на вход.
      setTimeout(() => {
        signIn(undefined, { callbackUrl: "/dashboard" });
        router.push("/login");
      }, 1800);
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
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">
            Новый пароль
          </h1>
          {!done && token && <p className="mt-2 text-sm text-muted">Придумайте пароль для входа</p>}
        </div>

        {!token ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
              <LinkIcon size={24} className="text-muted" aria-hidden />
            </span>
            <p className="mt-5 text-[15px] font-semibold text-foreground">Ссылка неполная</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Откройте ссылку из письма целиком — в ней есть код подтверждения. Если ссылка
              устарела, запросите восстановление заново.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              Запросить ссылку
            </Link>
          </div>
        ) : done ? (
          <div className="rounded-2xl border border-success-border bg-success-bg p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card">
              <CheckCircle2 size={24} className="text-success" aria-hidden />
            </span>
            <p className="mt-5 text-[15px] font-semibold text-foreground">Пароль изменён</p>
            <p className="mt-2 text-sm text-muted">Сейчас откроется страница входа…</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 rounded-2xl border border-border bg-card p-6"
          >
            <div>
              <Label htmlFor="password" hint={`минимум ${MIN_PASSWORD_LENGTH} символов`}>
                Новый пароль
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                placeholder="••••••••"
                {...register("password")}
              />
              <PasswordStrength value={watch("password") ?? ""} />
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-danger-text">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm">Повторите пароль</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••"
                {...register("confirm")}
              />
              {errors.confirm && (
                <p className="mt-1.5 text-xs font-medium text-danger-text">
                  {errors.confirm.message}
                </p>
              )}
            </div>

            {serverError && (
              <div role="alert" className="rounded-xl bg-danger-bg px-4 py-3">
                <p className="text-sm font-medium text-danger-text">{serverError}</p>
                <Link
                  href="/forgot-password"
                  className="mt-1.5 inline-block text-sm font-semibold text-danger-text underline"
                >
                  Запросить новую ссылку
                </Link>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Сохраняем…" : "Сохранить пароль"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
