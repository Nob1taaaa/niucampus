import { Skeleton } from "@/components/ui/skeleton";

const LostFoundSkeleton = () => (
  <main className="mx-auto max-w-6xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
    {/* Header */}
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <Skeleton className="h-7 w-36" />
      </div>
      <Skeleton className="h-4 w-64 mt-1" />
      <Skeleton className="h-9 w-72 rounded-full mt-3" />
    </div>
    {/* Tabs */}
    <div className="mb-4 rounded-2xl border border-border/40 p-3">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>
    </div>
    {/* Search */}
    <div className="mb-5 rounded-2xl border border-border/40 p-3">
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
    {/* Content grid */}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-card/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      {/* Form skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card/70 p-4 space-y-4 h-fit">
        <Skeleton className="h-1 w-full rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  </main>
);

export default LostFoundSkeleton;