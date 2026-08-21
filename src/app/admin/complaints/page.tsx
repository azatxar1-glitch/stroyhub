import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Flag } from "lucide-react";
import { ComplaintActions } from "./complaint-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { OPEN: "Открыта", RESOLVED: "Решена", DISMISSED: "Отклонена" };
const STATUS_VARIANT: Record<string, "warning" | "success" | "default"> = { OPEN: "warning", RESOLVED: "success", DISMISSED: "default" };
const TARGET_LABEL: Record<string, string> = { USER: "Пользователь", JOB: "Заявка" };

export default async function AdminComplaintsPage() {
  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Жалобы</h1>
        <p className="mt-1 text-muted">Модерация обращений пользователей</p>
      </div>

      {complaints.length === 0 ? (
        <EmptyState icon={Flag} title="Жалоб пока нет" />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium text-foreground">{c.reporter.name}</span>
                  <span className="text-muted"> ({c.reporter.email}) пожаловался на </span>
                  <Badge variant="default">{TARGET_LABEL[c.targetType]}</Badge>
                </div>
                <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
              </div>
              <p className="mt-2 text-sm text-foreground">{c.reason}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted">{formatDateTime(c.createdAt)}</span>
                {c.status === "OPEN" && <ComplaintActions id={c.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
