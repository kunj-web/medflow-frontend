import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-[#e7f4f7] via-white/80 to-[#d7edf3] bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function SkeletonLine({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-3 w-full", className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonLine className="h-4 w-2/3" />
          <SkeletonLine className="w-1/2" />
          <SkeletonLine className="w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({
  rows = 3,
  className,
}: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("grid gap-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
