"use client"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const VIEW_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    about: "About",
    projects: "Projects",
    skills: "Skills",
    experiences: "Experiences",
    chats: "Chats",
    analytics: "Analytics",
    settings: "Settings",
}

function BreadcrumbInner() {
    const searchParams = useSearchParams()
    const view = searchParams.get("view") || "dashboard"
    return <span className="text-sm font-medium">{VIEW_LABELS[view] ?? "Dashboard"}</span>
}

export function AdminBreadcrumb() {
    return (
        <Suspense fallback={<span className="text-sm font-medium">Dashboard</span>}>
            <BreadcrumbInner />
        </Suspense>
    )
}
