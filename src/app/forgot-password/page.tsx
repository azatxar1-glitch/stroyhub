"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const schema = z.object({ email: z.string().email("Некорректный email") });
type FormInput = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormInput) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Не удалось отправить письмо");
        return;
      }
      setSent(true);
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
            {sent ? "Проверьте почту" : "Восстановление пароля"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {sent
              ? "Мы отправили ссылку для смены пароля"
              : "Укажите email — пришлём ссылку для смены пароля"}
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-bg">
              <MailCheck size={24} className="text-success" aria-hidden />
            </span>
            <p className="mt-5 text-[15px] leading-relaxed text-foreground">
              Если аккаунт с адресом <span className="font-semibold">{getValues("email")}</span>{" "}
              существует, письмо со ссылкой уже отправлено.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Ссылка действует час и сработает один раз. Не пришло письмо — проверьте папку
              «Спам».
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-surface"
            >
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 rounded-2xl border border-border bg-card p-6"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-danger-text">{errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm font-medium text-danger-text">
                {serverError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Отправляем…" : "Отправить ссылку"}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft size={15} aria-hidden />
              Вернуться ко входу
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
