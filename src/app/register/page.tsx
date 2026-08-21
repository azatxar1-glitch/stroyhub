"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { HardHat, Users } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
          <h1 className="mt-6 text-2xl font-bold text-foreground">Создать аккаунт</h1>
          <p className="mt-1 text-sm text-muted">Зарегистрируйтесь как заказчик или исполнитель</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-sm">
          <div>
            <Label>Я хочу</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("role", "CUSTOMER")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-md border-2 px-3 py-3 text-sm font-medium transition-colors",
                  role === "CUSTOMER" ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-surface"
                )}
              >
                <HardHat size={20} />
                Найти исполнителя
              </button>
              <button
                type="button"
                onClick={() => setValue("role", "EXECUTOR")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-md border-2 px-3 py-3 text-sm font-medium transition-colors",
                  role === "EXECUTOR" ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-surface"
                )}
              >
                <Users size={20} />
                Оказывать услуги
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Имя / название компании</Label>
            <Input id="name" placeholder="Иван Строй" {...register("name")} />
            {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" type="password" placeholder="Минимум 6 символов" {...register("password")} />
            {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
          </Button>

          <p className="text-center text-sm text-muted">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
