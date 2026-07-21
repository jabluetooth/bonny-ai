
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
    status?: string | null;
    className?: string;
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
    const statusText = status || "Work in progress";
    const statusLower = statusText.toLowerCase();

    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit truncate",
            statusLower === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                statusLower === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
            className
        )}>
            {statusText}
        </span>
    );
}
