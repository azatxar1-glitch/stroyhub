import { BadgeCheck, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTrustSignals, isVerifiedExecutor, type TrustInput } from "@/lib/trust";
import { cn } from "@/lib/utils";

/** Compact "Проверенный специалист" mark — rendered only when earned. */
export function VerifiedMark({ input, className }: { input: TrustInput; className?: string }) {
  if (!isVerifiedExecutor(input)) return null;
  return (
    <span
      title="Выполнил заказы на площадке и имеет рейтинг 4.5+ по реальным отзывам"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-success-bg px-2 py-1 text-xs font-semibold leading-none text-success-text",
        className
      )}
    >
      <BadgeCheck size={13} aria-hidden />
      Проверенный
    </span>
  );
}

/** Full list of earned trust signals, used on the profile page. */
export function TrustSignalList({ input, className }: { input: TrustInput; className?: string }) {
  const signals = getTrustSignals(input);
  if (signals.length === 0) return null;

  return (
    <ul className={cn("space-y-2.5", className)}>
      {signals.map((s) => (
        <li key={s.key} className="flex items-start gap-2.5 text-sm" title={s.detail}>
          <span
            className={cn(
              "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
              s.tone === "success" ? "bg-success text-white" : "bg-surface-strong text-foreground"
            )}
          >
            <Check size={11} strokeWidth={3} aria-hidden />
          </span>
          <span className="text-foreground">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Inline chip row — used on cards where vertical space is tight. */
export function TrustChips({ input, max = 3, className }: { input: TrustInput; max?: number; className?: string }) {
  const signals = getTrustSignals(input).slice(0, max);
  if (signals.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {signals.map((s) => (
        <Badge key={s.key} variant={s.tone === "success" ? "success" : "default"} title={s.detail}>
          {s.tone === "success" && <BadgeCheck size={12} aria-hidden />}
          {s.label}
        </Badge>
      ))}
    </div>
  );
}
