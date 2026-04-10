import { Skeleton } from "@/components/ui/skeleton";

const StudyMaterialsSkeleton = () => (
  <main className="mx-auto max-w-6xl px-3 pb-16 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pt-8">
    {/* Header */}
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <Skeleton className="h-7 w-44" />
      </div>
      <Skeleton className="h-4 w-72 mt-1" />
      <Skeleton className="h-8 w-36 rounded-full mt-3" />
    </div>
    {/* Filters */}
    <div className="mb-6 rounded-2xl border border-border/40 p-3">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>
    </div>
    {/* Cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/70 p-4 space-y-3">
          <div className="h-1.5 rounded-full bg-muted/50 w-full" />
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      ))}
    </div>
  </main>
);

export default StudyMaterialsSkeleton;