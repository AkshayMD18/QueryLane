import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageHeaderProps {
    heading: string
    description?: string
    actions?: ReactNode
    className?: string
}

export function PageHeader({
    heading,
    description,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("py-6", className)}>
            <div className="flex items-start justify-between gap-4">

                {/* Left content */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {heading}
                    </h1>

                    {description && (
                        <p className="text-muted-foreground text-base max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>

                {/* Right actions */}
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* divider */}
            <div className="h-px bg-border mt-4" />
        </div>
    )
}