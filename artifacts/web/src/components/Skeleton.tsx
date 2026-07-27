interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`rounded-lg bg-white/10 animate-skeleton ${className}`} />;
}

export function MenuCardSkeleton() {
  return (
    <div className="thb-card-white overflow-hidden" style={{ transform: "none" }}>
      <Skeleton className="aspect-[4/3] rounded-none rounded-t-xl" />
      <div className="p-3.5 space-y-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-full" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DealCardSkeleton() {
  return (
    <div className="thb-card-white p-5 space-y-3" style={{ transform: "none" }}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
  );
}
