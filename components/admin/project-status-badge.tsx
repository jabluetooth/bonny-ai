
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
            statusLower === 'online' ? 'bg-green-100 text-green-800' :
                statusLower === 'down' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800',
            className
        )}>
            {statusText}
        </span>
    );
}
