"use client";

import { checkPassword } from "@/lib/password";
import { cn } from "@/lib/utils";

const TONE = {
  0: { bar: "bg-danger", text: "text-danger-text" },
  1: { bar: "bg-danger", text: "text-danger-text" },
  2: { bar: "bg-warning", text: "text-warning-text" },
  3: { bar: "bg-success", text: "text-success-text" },
} as const;

/**
 * Подсказка о надёжности пароля.
 *
 * Показывает не «правила», а результат: человек видит, что именно не так,
 * ещё до отправки формы. Пока поле пустое — ничего не рисуем, чтобы не
 * ругаться на пользователя заранее.
 */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const { score, label, problem } = checkPassword(value);
  const tone = TONE[score];

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((level) => (
          <span
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              score >= level ? tone.bar : "bg-surface-strong"
            )}
          />
        ))}
      </div>
      <p className={cn("mt-1.5 text-xs font-medium", tone.text)} aria-live="polite">
        {problem ?? label}
      </p>
    </div>
  );
}
