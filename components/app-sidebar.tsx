"use client"

import * as React from "react"
import {
    Briefcase,
    Code2,
    Cpu,
    Database,
    GraduationCap,
    Palette,
    User,
    ChevronDown,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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

import { ChatIntents } from "@/lib/intents"
import { VisitorCounter } from "@/components/visitor-counter"
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/shadcn-io/status"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    onNavClick: (query: string, intent?: string) => void
}

export function AppSidebar({ onNavClick, ...props }: AppSidebarProps) {
    return (
        <Sidebar side="left" collapsible="offcanvas" className="md:hidden" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-3 px-4 py-2">
                    <Avatar
                        className="h-10 w-10 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => onNavClick("Hello! Tell me about this portfolio.")}
                    >
                        <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" alt="Bonny AI" />
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-sm tracking-tight">Bonny-ai</span>
                        <Status status="online" className="px-1.5 py-0 h-5">
                            <StatusIndicator className="w-1.5 h-1.5" />
                            <StatusLabel className="text-[10px]">Online</StatusLabel>
                        </Status>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>

                        {/* About Group */}
                        <Collapsible defaultOpen className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <span>About</span>
                                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("Tell me about yourself.")}>
                                                <User />
                                                <span>Author</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("What is your professional background?", ChatIntents.BACKGROUND)}>
                                                <Briefcase />
                                                <span>Background</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("What are your interests outside of work?", ChatIntents.INTERESTS)}>
                                                <Palette />
                                                <span>Interests</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Projects Group */}
                        <Collapsible defaultOpen className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <span>Projects</span>
                                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("Show me your web development projects.", ChatIntents.PROJECTS_WEB)}>
                                                <Code2 />
                                                <span>Web Development</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("Tell me about your AI and Machine Learning projects.", ChatIntents.PROJECTS_AI)}>
                                                <Cpu />
                                                <span>AI & ML</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Skills Group */}
                        <Collapsible defaultOpen className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <span>Skills</span>
                                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("What are your Frontend Development skills?", ChatIntents.SKILLS_FRONTEND)}>
                                                <Code2 />
                                                <span>Frontend</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("What are your Backend Development skills?", ChatIntents.SKILLS_BACKEND)}>
                                                <Database />
                                                <span>Backend</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                        {/* Timeline Group */}
                        <Collapsible defaultOpen className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton>
                                        <span>Timeline</span>
                                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("Tell me about your work history.", ChatIntents.WORK_HISTORY)}>
                                                <Briefcase />
                                                <span>Work History</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton onClick={() => onNavClick("What is your educational background?", ChatIntents.EDUCATION)}>
                                                <GraduationCap />
                                                <span>Education</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>

                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

        </Sidebar>
    )
}
