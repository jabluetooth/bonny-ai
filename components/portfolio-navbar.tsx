"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useChat } from "@/components/chat-provider"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Code2,
    Cpu,
    Palette,
    Database,
    ChevronDown,
    ChevronUp,
    Layers,
    LineChart,
    Workflow,
    Wrench,
} from "lucide-react"

import { ChatIntents } from "@/lib/intents"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
import { toast } from "sonner"
import { AuthorCard } from "@/components/author-card"
import {
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { OPEN_CONTACT_EVENT } from "@/components/contact-cta"

const TRIGGER_CLASS = "bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full"

export function PortfolioNavbar() {
    const [resumeOpen, setResumeOpen] = useState(false)
    const { messages, isWelcomeOpen, startChat, conversationId, sendMessage } = useChat()
    const [isOpen, setIsOpen] = useState(true)
    const [isHoveringTrigger, setIsHoveringTrigger] = useState(false)
    const [navValue, setNavValue] = useState("")

    // Contact Form State
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const prevMsgLength = React.useRef(messages.length)

    // Resume State
    const [resumeUrl, setResumeUrl] = useState<string | null>(null)

    // Check mobile for conditional Sidebar rendering
    const isMobile = useIsMobile()

    const handleNavClick = async (query: string, intent?: string) => {
        let activeId = conversationId;
        // Ensure chat is started
        if (!activeId) {
            const newId = await startChat("Guest");
            if (newId) activeId = newId;
        }

        if (activeId) {
            sendMessage(query, intent, activeId);
            setNavValue("");
        }
    }

    const handleSendMessage = async () => {
        if (!email.trim() || !message.trim()) {
            toast.error("Please fill in both email and message fields.")
            return
        }

        setIsSending(true)
        try {
            const res = await fetch("/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, message }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to send message")
            }

            toast.success("Message sent successfully!", {
                description: "I'll get back to you as soon as possible.",
            })
            setEmail("")
            setMessage("")
            setResumeOpen(false)
        } catch (error) {
            console.error("Failed to send message", error)
            toast.error("Failed to send message. Please try again later.")
        } finally {
            setIsSending(false)
        }
    }

    // Auto-collapse when chat starts (0 -> 1+) or resets (-> 0)
    useEffect(() => {
        // If we went from empty to having messages, auto-close
        if (prevMsgLength.current === 0 && messages.length > 0) {
            setTimeout(() => setIsOpen(false), 0)
        }
        // If we cleared messages, auto-open
        else if (messages.length === 0) {
            setTimeout(() => setIsOpen(true), 0)
        }

        prevMsgLength.current = messages.length
    }, [messages.length])

    // Let other components (chat CTA, case-study dialog) open the drawer
    useEffect(() => {
        const open = () => setResumeOpen(true)
        window.addEventListener(OPEN_CONTACT_EVENT, open)
        return () => window.removeEventListener(OPEN_CONTACT_EVENT, open)
    }, [])

    // Fetch resume URL on mount
    useEffect(() => {
        const fetchResume = async () => {
            try {
                const res = await fetch("/api/resume")
                if (res.ok) {
                    const data = await res.json()
                    setResumeUrl(data.resume_url)
                }
            } catch (error) {
                console.error("Failed to fetch resume:", error)
            }
        }
        fetchResume()
    }, [])

    const handleDownloadResume = () => {
        if (resumeUrl) {
            window.open(resumeUrl, '_blank')
        } else {
            toast.error("Resume is not available yet. Please check back later.")
        }
    }

    return (
        <div className="sticky top-0 z-50 w-full flex-none">
            {/* Toggle Trigger (Desktop Only) */}
            {!isMobile && messages.length > 0 && !navValue && (
                <div
                    className="absolute w-full flex justify-center -bottom-5 z-50 pointer-events-auto"
                    onMouseEnter={() => setIsHoveringTrigger(true)}
                    onMouseLeave={() => setIsHoveringTrigger(false)}
                >
                    <Button
                        variant="secondary"
                        size="sm"
                        className={cn(
                            "h-5 px-6 rounded-b-xl rounded-t-none text-[10px] shadow-sm border border-t-0 bg-background/80 backdrop-blur-sm transition-all duration-300 flex items-end pb-1",
                            !isOpen && !isHoveringTrigger ? "opacity-50" : "opacity-100"
                        )}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </Button>
                </div>
            )}

            {/* Main Navbar Header Content */}
            <div
                className={cn(
                    "relative transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-auto w-full",
                    (isOpen || isMobile) ? "h-16 opacity-100" : "h-0 opacity-0 pointer-events-none overflow-hidden",
                    (resumeOpen || isWelcomeOpen) && "blur-sm"
                )}
            >
                {/* Progressive Blur Background - Extended to curtain over messages */}
                <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
                    <ProgressiveBlur
                        direction="top"
                        showBackground={true}
                        blurIntensity={4}
                        gradientStart="50%"
                        className="h-full w-full"
                    />
                </div>
                <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 relative z-10 w-full">

                    {/* LEFT: Mobile Sidebar Trigger + Wordmark */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Sidebar Trigger */}
                        <div className="md:hidden">
                            <SidebarTrigger className="ml-2 h-9 w-9" />
                        </div>

                        <button
                            type="button"
                            onClick={() => handleNavClick("Give me a quick overview of how you can help.")}
                            className="hidden md:flex items-center cursor-pointer hover:opacity-80 transition-opacity font-bold text-lg tracking-tight"
                        >
                            Fil Heinz
                        </button>
                    </div>

                    {/* CENTER: Navigation Menu (Desktop) */}
                    <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
                        <NavigationMenu value={navValue} onValueChange={setNavValue}>
                            <NavigationMenuList className="flex items-center justify-center gap-1 bg-background/20 backdrop-blur-xl border border-white/10 shadow-sm rounded-full px-1.5 py-1">
                                {/* 1. SERVICES: business problems I solve */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className={TRIGGER_CLASS}>Services</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                            <ListItem icon={<Wrench className="w-4 h-4" />} title="Problems I solve" onClick={() => handleNavClick("What problems can you solve for my business?", ChatIntents.SERVICES)}>
                                                Each service as problem, solution, and outcome.
                                            </ListItem>
                                            <ListItem icon={<Workflow className="w-4 h-4" />} title="How I work" onClick={() => handleNavClick("How do you usually approach a new client project?")}>
                                                From first call to launch and support.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* 2. CASE STUDIES */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className={TRIGGER_CLASS}>Case Studies</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                            <ListItem icon={<LineChart className="w-4 h-4" />} title="All case studies" onClick={() => handleNavClick("Show me case studies with results.", ChatIntents.PROJECTS_ALL)}>
                                                Problems solved and measurable results.
                                            </ListItem>
                                            <ListItem icon={<Cpu className="w-4 h-4" />} title="AI & Automation" onClick={() => handleNavClick("Show me your AI and automation work.", ChatIntents.PROJECTS_AI)}>
                                                Workflows and AI systems that save time.
                                            </ListItem>
                                            <ListItem icon={<Code2 className="w-4 h-4" />} title="Web Platforms" onClick={() => handleNavClick("Show me the web platforms you have delivered.", ChatIntents.PROJECTS_WEB)}>
                                                Customer-facing apps and internal tools.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* 3. EXPERTISE: skills */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className={TRIGGER_CLASS}>Expertise</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                            <ListItem icon={<Code2 className="w-4 h-4" />} title="Frontend" onClick={() => handleNavClick("What are your Frontend Development skills?", ChatIntents.SKILLS_FRONTEND)}>
                                                Interfaces customers actually use.
                                            </ListItem>
                                            <ListItem icon={<Database className="w-4 h-4" />} title="Backend & Data" onClick={() => handleNavClick("What are your Backend Development skills?", ChatIntents.SKILLS_BACKEND)}>
                                                APIs, databases, and integrations.
                                            </ListItem>
                                            <ListItem icon={<Palette className="w-4 h-4" />} title="Design" onClick={() => handleNavClick("What are your Design skills?", ChatIntents.SKILLS_DESIGN)}>
                                                Clear, usable product design.
                                            </ListItem>
                                            <ListItem icon={<Layers className="w-4 h-4" />} title="Other" onClick={() => handleNavClick("What are your Other Skills?", ChatIntents.SKILLS_OTHER)}>
                                                Communication and delivery.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* 4. ABOUT: profile, experience, education */}
                                <NavigationMenuItem value="about">
                                    <NavigationMenuTrigger className={TRIGGER_CLASS}>About</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[250px_1fr]">
                                            <li className="row-span-3">
                                                <NavigationMenuLink asChild>
                                                    {/* Lazy render: Only mount AuthorCard when About menu is open */}
                                                    {navValue === "about" ? <AuthorCard /> : <div className="h-full w-full min-h-[200px]" />}
                                                </NavigationMenuLink>
                                            </li>
                                            <ListItem title="Work History" onClick={() => handleNavClick("Walk me through your experience.", ChatIntents.WORK_HISTORY)}>
                                                Roles, companies, and what I delivered.
                                            </ListItem>
                                            <ListItem title="Education" onClick={() => handleNavClick("What is your educational background?", ChatIntents.EDUCATION)}>
                                                Degrees and certifications.
                                            </ListItem>
                                            <ListItem title="Resume" onClick={handleDownloadResume}>
                                                Download the PDF.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* RIGHT: Resume Button */}
                    <Button onClick={() => setResumeOpen(true)} className="rounded-full">Work with me</Button>
                </div>
            </div>

            {/* Mobile Sidebar Component (Sheet on Mobile) */}
            {isMobile && <AppSidebar onNavClick={handleNavClick} />}

            {/* Resume / Contact Drawer */}
            <Drawer open={resumeOpen} onOpenChange={setResumeOpen}>
                <DrawerContent className="max-w-[450px] mx-auto rounded-t-xl">
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle>Work with me</DrawerTitle>
                            <DrawerDescription>Tell me what you&apos;re trying to fix or build. Recruiters can grab my resume below.</DrawerDescription>
                        </DrawerHeader>

                        <div className="p-4 space-y-4">
                            {/* Message Form */}
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Input
                                        placeholder="Your Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isSending}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Textarea
                                        placeholder="What problem are you trying to solve? Include your timeline if you have one."
                                        className="min-h-[100px]"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={isSending}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleSendMessage} disabled={isSending}>
                                    {isSending ? "Sending..." : "Send Message"}
                                </Button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            {/* Resume Download */}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleDownloadResume}
                                disabled={!resumeUrl}
                            >
                                {resumeUrl ? "Download Resume" : "Resume Not Available"}
                            </Button>
                        </div>

                        <DrawerFooter>
                            <DrawerClose asChild>
                                <Button variant="ghost">Close</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
                        className
                    )}
                    {...props}
                >
                    <div className="flex items-center gap-2 text-sm font-medium leading-none">
                        {icon && <span className="text-muted-foreground">{icon}</span>}
                        {title}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
