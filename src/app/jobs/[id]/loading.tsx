import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailLoading() {
  return (
    <div className="container-page py-6 sm:py-10">
      <Skeleton className="h-5 w-36" />

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-full" />
            <Skeleton className="mt-2 h-8 w-2/3" />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
            <Skeleton className="mt-6 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-9 w-40" />
            <Skeleton className="mt-5 h-11 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
