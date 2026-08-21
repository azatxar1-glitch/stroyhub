import Link from "next/link";
import { MapPin, Clock, Users, Wallet, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/status-badge";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, timeAgo } from "@/lib/utils";
import { plural } from "@/lib/trust";

export type JobCardData = {
  id: string;
  title: string;
  city: string;
  budget: number | null;
  deadline: string | null;
  locationType: string;
  status: string;
  createdAt: string | Date;
  category: { name: string; icon: string | null };
  _count?: { proposals: number };
};

/**
 * Reads like a real order posting: the commercial terms (budget, deadline,
 * format, location) are a labelled grid rather than a run of muted metadata.
 */
export function JobCard({ job }: { job: JobCardData }) {
  const proposals = job._count?.proposals;
  const isRemote = job.locationType === "REMOTE";

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_8px_24px_-12px_rgb(17_24_39/0.18)] focus-within:border-accent">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="default">
          <CategoryIcon name={job.category.icon} size={13} />
          {job.category.name}
        </Badge>
        <JobStatusBadge status={job.status} />
      </div>

      <h3 className="mt-3.5 line-clamp-2 text-base font-bold leading-snug text-foreground">
        <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0 focus:outline-none">
          {job.title}
        </Link>
      </h3>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-muted">
            <Wallet size={12} aria-hidden /> Бюджет
          </dt>
          <dd className="mt-0.5 font-bold text-foreground">{formatMoney(job.budget)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-muted">
            <Clock size={12} aria-hidden /> Срок
          </dt>
          <dd className="mt-0.5 truncate font-semibold text-foreground">{job.deadline || "Обсуждается"}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-muted">
            {isRemote ? <Wifi size={12} aria-hidden /> : <MapPin size={12} aria-hidden />} Формат
          </dt>
          <dd className="mt-0.5 truncate font-semibold text-foreground">
            {isRemote ? "Удалённо" : job.city}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-muted">
            <Users size={12} aria-hidden /> Откликов
          </dt>
          <dd className="mt-0.5 font-semibold text-foreground">
            {proposals === undefined ? "—" : proposals}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="text-xs text-muted">{timeAgo(job.createdAt)}</span>
        <span className="relative z-10 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
          Посмотреть заявку
        </span>
      </div>
    </article>
  );
}

/** Wide row variant used in the jobs feed, where scanning many postings matters. */
export function JobRow({ job }: { job: JobCardData }) {
  const proposals = job._count?.proposals;
  const isRemote = job.locationType === "REMOTE";

  return (
    <article className="group relative rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-[0_8px_24px_-12px_rgb(17_24_39/0.18)] focus-within:border-accent">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">
              <CategoryIcon name={job.category.icon} size={13} />
              {job.category.name}
            </Badge>
            <JobStatusBadge status={job.status} />
            <span className="text-xs text-muted">{timeAgo(job.createdAt)}</span>
          </div>
          <h3 className="mt-2.5 text-lg font-bold leading-snug text-foreground">
            <Link href={`/jobs/${job.id}`} className="after:absolute after:inset-0 focus:outline-none">
              {job.title}
            </Link>
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-muted">Бюджет</div>
          <div className="text-lg font-bold text-foreground">{formatMoney(job.budget)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3.5 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          {isRemote ? <Wifi size={14} aria-hidden /> : <MapPin size={14} aria-hidden />}
          {isRemote ? "Удалённо" : job.city}
        </span>
        {job.deadline && (
          <span className="flex items-center gap-1.5">
            <Clock size={14} aria-hidden />
            {job.deadline}
          </span>
        )}
        {proposals !== undefined && (
          <span className="flex items-center gap-1.5">
            <Users size={14} aria-hidden />
            {proposals} {plural(proposals, "отклик", "отклика", "откликов")}
          </span>
        )}
        <span className="relative z-10 ml-auto rounded-lg border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
          Посмотреть заявку
        </span>
      </div>
    </article>
  );
}
