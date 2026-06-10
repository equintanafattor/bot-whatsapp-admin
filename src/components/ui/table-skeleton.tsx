import { Skeleton } from "./skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton
                key={j}
                className="h-4"
                style={{ width: `${Math.floor(Math.random() * 40 + 60)}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
