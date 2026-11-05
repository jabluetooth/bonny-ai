"use client"

import * as React from "react"
import {
    Briefcase,
    Code2,
    Cpu,
    Database,
    GraduationCap,
    Layers,
    LineChart,
    Mail,
    Palette,
    User,
    Workflow,
    Wrench,
    ChevronDown,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { ChatIntents } from "@/lib/intents"
import { openContact } from "@/components/contact-cta"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    onNavClick: (query: string, intent?: string, href?: string) => void
}

interface NavLink {
    label: string
    icon: React.ComponentType
    query: string
    intent?: string
    /** Page holding this content, used when the chat isn't on screen. */
    href: string
}

// Mirrors the desktop navigation in portfolio-navbar.tsx.
const GROUPS: { title: string; links: NavLink[] }[] = [
    {
        title: "Services",
        links: [
            { label: "Problems I solve", icon: Wrench, query: "What problems can you solve for my business?", intent: ChatIntents.SERVICES, href: "/services" },
            { label: "How I work", icon: Workflow, query: "How do you usually approach a new client project?", href: "/services" },
        ],
    },
    {
        title: "Case Studies",
        links: [
            { label: "All case studies", icon: LineChart, query: "Show me case studies with results.", intent: ChatIntents.PROJECTS_ALL, href: "/projects" },
            { label: "AI & Automation", icon: Cpu, query: "Show me your AI and automation work.", intent: ChatIntents.PROJECTS_AI, href: "/projects" },
            { label: "Web Platforms", icon: Code2, query: "Show me the web platforms you have delivered.", intent: ChatIntents.PROJECTS_WEB, href: "/projects" },
        ],
    },
    {
        title: "Expertise",
        links: [
            { label: "Frontend", icon: Code2, query: "What are your Frontend Development skills?", intent: ChatIntents.SKILLS_FRONTEND, href: "/skills" },
            { label: "Backend & Data", icon: Database, query: "What are your Backend Development skills?", intent: ChatIntents.SKILLS_BACKEND, href: "/skills" },
            { label: "Design", icon: Palette, query: "What are your Design skills?", intent: ChatIntents.SKILLS_DESIGN, href: "/skills" },
            { label: "Other", icon: Layers, query: "What are your Other Skills?", intent: ChatIntents.SKILLS_OTHER, href: "/skills" },
        ],
    },
    {
        title: "About",
        links: [
            { label: "Profile", icon: User, query: "Tell me about yourself.", intent: ChatIntents.ABOUT_ME, href: "/about" },
            { label: "Work History", icon: Briefcase, query: "Walk me through your experience.", intent: ChatIntents.WORK_HISTORY, href: "/experiences" },
            { label: "Education", icon: GraduationCap, query: "What is your educational background?", intent: ChatIntents.EDUCATION, href: "/experiences" },
        ],
    },
]

export function AppSidebar({ onNavClick, ...props }: AppSidebarProps) {
    return (
        <Sidebar side="left" collapsible="offcanvas" className="md:hidden" {...props}>
            <SidebarHeader>
                <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-2 text-left"
                    onClick={() => onNavClick("Give me a quick overview of how you can help.", undefined, "/")}
                >
                    <Avatar className="h-10 w-10 rounded-none bg-transparent">
                        <AvatarImage src="/bot-avatar.png" alt="Bonny-AI" />
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <span className="flex flex-col">
                        <span className="font-semibold text-sm tracking-tight">Bonny-AI</span>
                        <span className="text-xs text-muted-foreground">Automation & AI Solutions</span>
                    </span>
                </button>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {GROUPS.map((group) => (
                            <Collapsible key={group.title} defaultOpen className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton>
                                            <span>{group.title}</span>
                                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {group.links.map(({ label, icon: Icon, query, intent, href }) => (
                                                <SidebarMenuSubItem key={label}>
                                                    <SidebarMenuSubButton onClick={() => onNavClick(query, intent, href)}>
                                                        <Icon />
                                                        <span>{label}</span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <Button className="w-full" onClick={openContact}>
                    <Mail className="mr-2 h-4 w-4" /> Work with me
                </Button>
            </SidebarFooter>
        </Sidebar>
    )
}
