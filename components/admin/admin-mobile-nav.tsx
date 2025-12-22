"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    User,
    Briefcase,
    Code,
    Clock,
    BarChart3,
    MessageSquare,
    Settings,
    Menu,
    LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: User, label: "About", href: "/admin/about" },
    { icon: Briefcase, label: "Projects", href: "/admin/projects" },
    { icon: Code, label: "Skills", href: "/admin/skills" },
    { icon: Clock, label: "Experiences", href: "/admin/experiences" },
    { icon: MessageSquare, label: "Chats", href: "/admin/chats" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminMobileNav() {
    const pathname = usePathname()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                    <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <span className="sr-only">Bonny AI Admin</span>
                        <span>Bonny AI Admin</span>
                    </Link>
                    {sidebarItems.map((item, index) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-3 py-2 transition-all hover:text-foreground",
                                    isActive
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
                <div className="mt-auto">
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                        <Link href="/">
                            <LogOut className="h-4 w-4" />
                            Exit Admin
                        </Link>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
