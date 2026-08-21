"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { HardHat } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-[calc(100vh-64px)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
              <HardHat size={20} />
            </span>
            <span className="text-lg">СтройХаб</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Вход в аккаунт</h1>
          <p className="mt-1 text-sm text-muted">Рады видеть вас снова</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </Button>

          <p className="text-center text-sm text-muted">
            Нет аккаунта?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
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
