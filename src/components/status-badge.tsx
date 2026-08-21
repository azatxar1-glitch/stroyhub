import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, ORDER_STATUS_LABELS, type JobStatus, type OrderStatus } from "@/lib/constants";

const JOB_VARIANTS: Record<JobStatus, "success" | "info" | "default" | "danger"> = {
  OPEN: "success",
  IN_PROGRESS: "info",
  COMPLETED: "default",
  CANCELLED: "danger",
};

const ORDER_VARIANTS: Record<OrderStatus, "info" | "warning" | "accent" | "success" | "danger"> = {
  NEW: "info",
  IN_PROGRESS: "warning",
  REVIEW: "accent",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export function JobStatusBadge({ status }: { status: string }) {
  const s = status as JobStatus;
  return <Badge variant={JOB_VARIANTS[s] ?? "default"}>{JOB_STATUS_LABELS[s] ?? status}</Badge>;
}

export function OrderStatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return <Badge variant={ORDER_VARIANTS[s] ?? "default"}>{ORDER_STATUS_LABELS[s] ?? status}</Badge>;
}
