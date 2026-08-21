"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Не удалось загрузить данные",
  description = "Проверьте подключение к интернету и попробуйте ещё раз.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-danger/20 bg-danger-bg px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-card">
        <AlertTriangle size={24} className="text-danger-text" aria-hidden />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6 gap-2" onClick={onRetry}>
          <RotateCw size={16} aria-hidden />
          Повторить
        </Button>
      )}
    </div>
  );
}
