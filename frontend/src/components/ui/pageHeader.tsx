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
        <div className={cn("pb-6 pt-2 md:pb-8 md:pt-3", className)}>
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                {/* Left content */}
                <div className="flex max-w-2xl flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight capitalize md:text-4xl">
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
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        {actions}
                    </div>
                )}
            </div>

            {/* divider */}
            <div className="mt-5 h-px bg-border md:mt-6" />
        </div>
    )
}
