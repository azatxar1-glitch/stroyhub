import { Skeleton } from "@/components/ui/skeleton";

export default function ExecutorProfileLoading() {
  return (
    <div className="container-page py-6 sm:py-10">
      <Skeleton className="h-5 w-44" />

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        <Skeleton className="h-20 w-full rounded-none sm:h-24" />
        <div className="p-5">
          <div className="flex items-end gap-5">
            <Skeleton className="-mt-14 h-24 w-24 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <div className="mt-5 flex gap-4 border-t border-border pt-5">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-9 w-40" />
            <Skeleton className="mt-5 h-11 w-full rounded-xl" />
            <Skeleton className="mt-2.5 h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
