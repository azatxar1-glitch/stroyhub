import Link from "next/link";
import { MapPin, Clock, MessageSquareText, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/status-badge";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, timeAgo } from "@/lib/utils";

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

export function JobCard({ job }: { job: JobCardData }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block h-full">
      <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
        <CardContent className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="primary" className="gap-1.5">
              <CategoryIcon name={job.category.icon} size={14} />
              {job.category.name}
            </Badge>
            <JobStatusBadge status={job.status} />
          </div>

          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">{job.title}</h3>

          <div className="mt-auto flex flex-col gap-1.5 text-sm text-muted">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              {job.locationType === "REMOTE" ? "Удалённо" : job.city}
            </div>
            {job.deadline && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                {job.deadline}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Wallet size={16} />
              {formatMoney(job.budget)}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              {job._count !== undefined && (
                <span className="flex items-center gap-1">
                  <MessageSquareText size={14} />
                  {job._count.proposals}
                </span>
              )}
              <span>{timeAgo(job.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
