import { Skeleton, ExecutorCardSkeleton } from "@/components/ui/skeleton";

export default function ExecutorsLoading() {
  return (
    <div className="container-page py-8 sm:py-10">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-3 h-5 w-56" />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[276px_1fr] lg:gap-8">
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-20" />
            <div className="mt-5 space-y-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 rounded-xl sm:w-60" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ExecutorCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
