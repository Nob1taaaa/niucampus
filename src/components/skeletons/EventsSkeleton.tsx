import { Skeleton } from "@/components/ui/skeleton";

const EventsSkeleton = () => (
  <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 md:px-6 md:pt-8">
    {/* Header skeleton */}
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-4 w-72 mt-1" />
      <div className="flex items-center gap-2 mt-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    </div>
    {/* Search skeleton */}
    <div className="mb-6 rounded-2xl border border-border/40 p-3">
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
    {/* Cards skeleton */}
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/70 p-5 space-y-3">
          <div className="h-1.5 rounded-full bg-muted/50 w-full" />
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </main>
);

export default EventsSkeleton;