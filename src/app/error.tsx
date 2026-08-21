"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-bg">
        <AlertTriangle size={28} className="text-danger-text" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">Что-то пошло не так</h1>
      <p className="mt-3 max-w-md text-muted">
        Не удалось загрузить страницу. Попробуйте ещё раз — если ошибка повторяется, вернитесь на главную.
      </p>
      {error.digest && <p className="mt-2 text-xs text-faint">Код ошибки: {error.digest}</p>}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} className="gap-2">
          <RotateCw size={17} aria-hidden />
          Повторить
        </Button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
