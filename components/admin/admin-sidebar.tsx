"use client"

import {
    LayoutDashboard,
    User,
    Briefcase,
    Code,
    Clock,
    BarChart3,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    AudioWaveform,
    Command,
    GalleryVerticalEnd
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarFooter
} from "@/components/ui/sidebar"

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/admin",
            view: "dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "About",
            url: "/admin?view=about",
            view: "about",
            icon: User,
        },
        {
            title: "Projects",
            url: "/admin?view=projects",
            view: "projects",
            icon: Briefcase,
        },
        {
            title: "Skills",
            url: "/admin?view=skills",
            view: "skills",
            icon: Code,
        },
        {
            title: "Experiences",
            url: "/admin?view=experiences",
            view: "experiences",
            icon: Clock,
        },
    ],
    navDigital: [
        {
            title: "Chats",
            url: "/admin?view=chats",
            view: "chats",
            icon: MessageSquare,
        },
        {
            title: "Analytics",
            url: "/admin?view=analytics",
            view: "analytics",
            icon: BarChart3,
        },
        {
            title: "Settings",
            url: "/admin?view=settings",
            view: "settings",
            icon: Settings,
        },
    ]
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentView = searchParams.get("view") || "dashboard"

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:justify-center">
                            <Link href="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-semibold">Bonny AI</span>
                                    <span className="truncate text-xs">Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navMain.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={currentView === item.view}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navDigital.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={currentView === item.view}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Logout">
                            <Link href="/api/auth/signout">
                                <LogOut />
                                <span>Logout</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
