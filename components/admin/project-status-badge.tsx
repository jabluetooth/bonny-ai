
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
    status?: string | null;
    className?: string;
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
    const statusText = status || "Work in progress";

    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit truncate",
            statusText === 'Online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                statusText === 'Down' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
            className
        )}>
            {statusText}
        </span>
    );
}
