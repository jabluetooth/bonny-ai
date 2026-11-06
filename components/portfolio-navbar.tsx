"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { ChatIntents } from "@/lib/intents"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
import { toast } from "sonner"
import { AuthorCard } from "@/components/author-card"
import {
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { OPEN_CONTACT_EVENT } from "@/components/contact-cta"

const TRIGGER_CLASS = "bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300"

export function PortfolioNavbar() {
    const [resumeOpen, setResumeOpen] = useState(false)
    const { messages, sendMessage } = useChat()
    const [isOpen, setIsOpen] = useState(true)
    const [isHoveringTrigger, setIsHoveringTrigger] = useState(false)
    const [navValue, setNavValue] = useState("")

    // Contact Form State
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    // Honeypot: hidden from people, filled in by bots. See app/api/send.
    const [website, setWebsite] = useState("")
    const prevMsgLength = React.useRef(messages.length)

    // Resume State
    const [resumeUrl, setResumeUrl] = useState<string | null>(null)

    // Check mobile for conditional Sidebar rendering
    const isMobile = useIsMobile()

    const pathname = usePathname()
    const router = useRouter()
    const isHome = pathname === "/"
    // Only the homepage chat collapses the bar; subpages always show it.
    const navShown = isOpen || isMobile || !isHome

    // On the homepage a menu item asks the chat; everywhere else the chat
    // isn't on screen, so it goes to the page that holds that content.
    const handleNavClick = async (query: string, intent?: string, href: string = "/") => {
        if (!isHome) {
            setNavValue("")
            router.push(href)
            return
        }

        // sendMessage starts the visitor's session if there isn't one yet.
        setNavValue("")
        await sendMessage(query, intent)
    }

    // Menu item click handler: on the homepage it asks the chat instead of
    // following the link; elsewhere the link navigates normally.
    const ask = (query: string, intent?: string) => (e: React.MouseEvent) => {
        if (isHome) {
            e.preventDefault()
            handleNavClick(query, intent)
        } else {
            setNavValue("")
        }
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!email.trim() || !message.trim()) {
            toast.error("Add your email and a message, then send.")
            return
        }

        setIsSending(true)
        try {
            const res = await fetch("/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, message, website }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "The message couldn’t be sent. Please try again in a minute.")
            }

            toast.success("Message sent", {
                description: "Thanks! I'll reply to the email you gave.",
            })
            setEmail("")
            setMessage("")
            setResumeOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "The message couldn’t be sent. Please try again in a minute.")
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
            {isHome && !isMobile && messages.length > 0 && !navValue && (
                <div
                    className="absolute w-full flex justify-center -bottom-5 z-50 pointer-events-auto"
                    onMouseEnter={() => setIsHoveringTrigger(true)}
                    onMouseLeave={() => setIsHoveringTrigger(false)}
                >
                    <Button
                        variant="secondary"
                        size="sm"
                        aria-label={isOpen ? "Hide navigation" : "Show navigation"}
                        aria-expanded={isOpen}
                        className={cn(
                            "h-6 px-8 rounded-b-xl rounded-t-none text-[10px] shadow-sm border border-t-0 bg-background/80 backdrop-blur-sm transition-all duration-300 flex items-end pb-1",
                            !isOpen && !isHoveringTrigger ? "opacity-50" : "opacity-100"
                        )}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
                    </Button>
                </div>
            )}

            {/* Main Navbar Header Content */}
            <div
                inert={!navShown}
                className={cn(
                    "relative transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-auto w-full",
                    navShown ? "h-16 opacity-100" : "h-0 opacity-0 pointer-events-none overflow-hidden",
                    resumeOpen && "blur-sm"
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

                        <Link
                            href="/"
                            className="flex items-center hover:opacity-80 transition-opacity font-bold text-lg tracking-tight rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Bonny-AI
                        </Link>
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
                                            <ListItem icon={<Wrench className="w-4 h-4" />} title="Problems I solve" href="/services" onClick={ask("What problems can you solve for my business?", ChatIntents.SERVICES)}>
                                                Each service as problem, solution, and outcome.
                                            </ListItem>
                                            <ListItem icon={<Workflow className="w-4 h-4" />} title="How I work" href="/services" onClick={ask("How do you usually approach a new client project?")}>
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
                                            <ListItem icon={<LineChart className="w-4 h-4" />} title="All case studies" href="/projects" onClick={ask("Show me case studies with results.", ChatIntents.PROJECTS_ALL)}>
                                                Problems solved and measurable results.
                                            </ListItem>
                                            <ListItem icon={<Cpu className="w-4 h-4" />} title="AI & Automation" href="/projects" onClick={ask("Show me your AI and automation work.", ChatIntents.PROJECTS_AI)}>
                                                Workflows and AI systems that save time.
                                            </ListItem>
                                            <ListItem icon={<Code2 className="w-4 h-4" />} title="Web Platforms" href="/projects" onClick={ask("Show me the web platforms you have delivered.", ChatIntents.PROJECTS_WEB)}>
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
                                            <ListItem icon={<Code2 className="w-4 h-4" />} title="Frontend" href="/skills" onClick={ask("What are your Frontend Development skills?", ChatIntents.SKILLS_FRONTEND)}>
                                                Interfaces customers actually use.
                                            </ListItem>
                                            <ListItem icon={<Database className="w-4 h-4" />} title="Backend & Data" href="/skills" onClick={ask("What are your Backend Development skills?", ChatIntents.SKILLS_BACKEND)}>
                                                APIs, databases, and integrations.
                                            </ListItem>
                                            <ListItem icon={<Palette className="w-4 h-4" />} title="Design" href="/skills" onClick={ask("What are your Design skills?", ChatIntents.SKILLS_DESIGN)}>
                                                Clear, usable product design.
                                            </ListItem>
                                            <ListItem icon={<Layers className="w-4 h-4" />} title="Other" href="/skills" onClick={ask("What are your Other Skills?", ChatIntents.SKILLS_OTHER)}>
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
                                            <ListItem title="Work History" href="/experiences" onClick={ask("Walk me through your experience.", ChatIntents.WORK_HISTORY)}>
                                                Roles, companies, and what I delivered.
                                            </ListItem>
                                            <ListItem title="Education" href="/experiences" onClick={ask("What is your educational background?", ChatIntents.EDUCATION)}>
                                                Degrees and certifications.
                                            </ListItem>
                                            <ListItem title="Resume" href="/about" onClick={(e) => { e.preventDefault(); setNavValue(""); handleDownloadResume() }}>
                                                Download the PDF.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* RIGHT: Resume Button */}
                    <InteractiveHoverButton onClick={() => setResumeOpen(true)}>Work with me</InteractiveHoverButton>
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
                            <form className="space-y-3" onSubmit={handleSendMessage}>
                                <div className="space-y-1.5">
                                    <label htmlFor="contact-email" className="text-sm font-medium">Your email</label>
                                    <Input
                                        id="contact-email"
                                        name="email"
                                        placeholder="you@company.com"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isSending}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="contact-message" className="text-sm font-medium">Message</label>
                                    <Textarea
                                        id="contact-message"
                                        name="message"
                                        placeholder="What problem are you trying to solve? Include your timeline if you have one."
                                        className="min-h-[100px]"
                                        required
                                        maxLength={5000}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={isSending}
                                    />
                                </div>
                                {/* Honeypot, kept off-screen and out of the tab order. */}
                                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                                    <label htmlFor="contact-website">Website</label>
                                    <input
                                        id="contact-website"
                                        name="website"
                                        type="text"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSending}>
                                    {isSending ? "Sending…" : "Send message"}
                                </Button>
                            </form>

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
    Omit<React.ComponentPropsWithoutRef<"a">, "href"> & { icon?: React.ReactNode; href: string }
>(({ className, title, children, icon, href, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    href={href}
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
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
