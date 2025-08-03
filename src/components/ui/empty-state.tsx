import * as React from "react"
import { Button } from "./button"
import { Card, CardContent } from "./card"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  className?: string
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className }, ref) => {
    return (
      <Card ref={ref} className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {icon && (
            <div className="mb-4 text-muted-foreground">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          {description && (
            <p className="text-muted-foreground mb-6 max-w-sm">
              {description}
            </p>
          )}
          {action && (
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }