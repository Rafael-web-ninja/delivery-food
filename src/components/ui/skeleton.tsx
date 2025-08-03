import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Componentes de skeleton específicos para o app
function CardSkeleton() {
  return (
    <div className="p-6 space-y-4 border rounded-lg animate-fade-in">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[90%]" />
      </div>
    </div>
  )
}

function MenuItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg animate-fade-in">
      <Skeleton className="h-16 w-16 rounded-md" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-3 w-[100px]" />
        <Skeleton className="h-4 w-[60px]" />
      </div>
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-fade-in">
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 p-4 border-b">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, CardSkeleton, MenuItemSkeleton, TableSkeleton }
