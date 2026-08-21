import Link from "next/link";
import { MapPin, Briefcase, Wifi, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerifiedMark } from "@/components/trust-badges";
import { formatMoney } from "@/lib/utils";
import { plural } from "@/lib/trust";

export type ExecutorCardData = {
  id: string;
  headline: string;
  experienceYears: number;
  remoteAvailable: boolean;
  priceFrom: number | null;
  ratingAvg: number;
  ratingCount: number;
  completedOrders: number;
  availability?: string;
  category: { name: string; icon: string | null };
  user: { id: string; name: string; avatarUrl: string | null; city: string | null; phone?: string | null };
  skills?: { skill: { name: string } }[];
};

/**
 * Scannable specialist card: identity and proof first, description lives on the
 * profile. One action, so the card has a single obvious next step.
 */
export function ExecutorCard({ executor }: { executor: ExecutorCardData }) {
  const trust = {
    phone: executor.user.phone,
    ratingAvg: executor.ratingAvg,
    ratingCount: executor.ratingCount,
    completedOrders: executor.completedOrders,
  };
  const skills = executor.skills?.slice(0, 4).map((s) => s.skill.name) ?? [];
  const isAvailable = executor.availability !== "BUSY";

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_8px_24px_-12px_rgb(17_24_39/0.18)] focus-within:border-accent">
      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          <Avatar src={executor.user.avatarUrl} name={executor.user.name} size={56} />
          <span
            title={isAvailable ? "Свободен для заказов" : "Занят"}
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${
              isAvailable ? "bg-success" : "bg-warning"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold leading-tight text-foreground">
            <Link href={`/executors/${executor.id}`} className="after:absolute after:inset-0 focus:outline-none">
              {executor.user.name}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted">{executor.category.name}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {executor.ratingCount > 0 ? (
              <span className="flex items-center gap-1 text-sm">
                <Star size={14} className="fill-accent text-accent" aria-hidden />
                <span className="font-bold text-foreground">{executor.ratingAvg.toFixed(1)}</span>
                <span className="text-muted">
                  ({executor.ratingCount} {plural(executor.ratingCount, "отзыв", "отзыва", "отзывов")})
                </span>
              </span>
            ) : (
              <span className="text-sm text-muted">Пока без отзывов</span>
            )}
            {executor.completedOrders > 0 && (
              <span className="text-sm text-muted">
                {executor.completedOrders} {plural(executor.completedOrders, "заказ", "заказа", "заказов")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        <VerifiedMark input={trust} />
        {executor.experienceYears > 0 && (
          <Badge variant="default">
            <Briefcase size={12} aria-hidden />
            {executor.experienceYears} {plural(executor.experienceYears, "год", "года", "лет")} опыта
          </Badge>
        )}
      </div>

      {skills.length > 0 && (
        <p className="mt-3 truncate text-sm text-muted" title={skills.join(" · ")}>
          {skills.join(" · ")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} aria-hidden />
          {executor.user.city ?? "Город не указан"}
        </span>
        {executor.remoteAvailable && (
          <span className="flex items-center gap-1.5">
            <Wifi size={14} aria-hidden />
            Удалённо
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div>
          <div className="text-xs text-muted">Стоимость</div>
          <div className="text-base font-bold text-foreground">
            {executor.priceFrom ? `от ${formatMoney(executor.priceFrom)}` : "Договорная"}
          </div>
        </div>
        <span className="relative z-10 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
          Профиль
        </span>
      </div>
    </article>
  );
}
