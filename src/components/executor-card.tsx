import Link from "next/link";
import { MapPin, Briefcase, Wifi } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney } from "@/lib/utils";

export type ExecutorCardData = {
  id: string;
  headline: string;
  experienceYears: number;
  remoteAvailable: boolean;
  priceFrom: number | null;
  ratingAvg: number;
  ratingCount: number;
  completedOrders: number;
  category: { name: string; icon: string | null };
  user: { id: string; name: string; avatarUrl: string | null; city: string | null };
};

export function ExecutorCard({ executor }: { executor: ExecutorCardData }) {
  return (
    <Link href={`/executors/${executor.id}`} className="block h-full">
      <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
        <CardContent className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar src={executor.user.avatarUrl} name={executor.user.name} size={48} />
            <div className="min-w-0">
              <div className="truncate font-semibold text-foreground">{executor.user.name}</div>
              <RatingStars value={executor.ratingAvg} count={executor.ratingCount} size={13} />
            </div>
          </div>

          <Badge variant="primary" className="w-fit gap-1.5">
            <CategoryIcon name={executor.category.icon} size={14} />
            {executor.category.name}
          </Badge>

          <p className="line-clamp-2 text-sm text-muted">{executor.headline}</p>

          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {executor.user.city ?? "Не указан"}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={13} />
              {executor.experienceYears} лет опыта
            </span>
            {executor.remoteAvailable && (
              <span className="flex items-center gap-1">
                <Wifi size={13} />
                Удалённо
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">
              от {formatMoney(executor.priceFrom)}
            </span>
            <span className="text-xs text-muted">{executor.completedOrders} заказов</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
