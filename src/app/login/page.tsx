"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { ...data, redirect: false });
      if (res?.error) {
        setServerError("Неверный email или пароль");
        return;
      }
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      router.push(callbackUrl);
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
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">Вход в аккаунт</h1>
          <p className="mt-2 text-sm text-muted">Рады видеть вас снова</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-border bg-card p-6">
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
            {errors.email && <p className="mt-1.5 text-xs font-medium text-danger-text">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
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
            {loading ? "Вход…" : "Войти"}
          </Button>

          <p className="text-center text-sm text-muted">
            Нет аккаунта?{" "}
            <Link href="/register" className="font-semibold text-accent-text hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
