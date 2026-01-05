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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
    Palette,
    Database,
    Users,
    ChevronDown,
    ChevronUp,
    Layers,
} from "lucide-react"

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
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

    return (
        <div className="relative z-50 w-full flex-none">
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

                    {/* LEFT: Mobile Sidebar Trigger + Avatar */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Sidebar Trigger */}
                        <div className="md:hidden">
                            <SidebarTrigger className="ml-2 h-9 w-9" />
                        </div>

                        <Avatar onClick={() => handleNavClick("Hello! Tell me about this portfolio.")} className="hidden md:flex cursor-pointer hover:scale-105 transition-transform rounded-none bg-transparent">
                            <AvatarImage src="/avatar.png" alt="Profile" />
                            <AvatarFallback>Ad</AvatarFallback>
                        </Avatar>
                    </div>

                    {/* CENTER: Navigation Menu (Desktop) */}
                    <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
                        <NavigationMenu value={navValue} onValueChange={setNavValue}>
                            <NavigationMenuList className="flex items-center justify-center gap-1 bg-background/20 backdrop-blur-xl border border-white/10 shadow-sm rounded-full px-1.5 py-1">
                                {/* 1. ABOUT: Author/Developer, Background, Interests, Vision */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">About</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[250px_1fr]">
                                            <li className="row-span-3">
                                                <NavigationMenuLink asChild>
                                                    <AuthorCard />
                                                </NavigationMenuLink>
                                            </li>
                                            <ListItem title="Background" onClick={() => handleNavClick("What is your professional background?", ChatIntents.BACKGROUND)}>
                                                My journey and career path.
                                            </ListItem>
                                            <ListItem title="Interests" onClick={() => handleNavClick("What are your interests outside of work?", ChatIntents.INTERESTS)}>
                                                Hobbies and personal passions.
                                            </ListItem>
                                            <ListItem title="Vision" onClick={() => handleNavClick("What is your vision for the future?", ChatIntents.VISION)}>
                                                Future goals and aspirations.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* 2. PROJECTS: Web Dev, AI & ML */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Projects</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                            <ListItem title="Web Development" onClick={() => handleNavClick("Show me your web development projects.", ChatIntents.PROJECTS_WEB)}>
                                                Full-stack web applications.
                                            </ListItem>
                                            <ListItem title="AI & ML" onClick={() => handleNavClick("Tell me about your AI and Machine Learning projects.", ChatIntents.PROJECTS_AI)}>
                                                Machine learning models.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* 3. SKILLS: Frontend, Backend, Design, Other */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Skills</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                            <ListItem icon={<Code2 className="w-4 h-4" />} title="Frontend" onClick={() => handleNavClick("What are your Frontend Development skills?", ChatIntents.SKILLS_FRONTEND)}>
                                                React, Next.js, TypeScript.
                                            </ListItem>
                                            <ListItem icon={<Database className="w-4 h-4" />} title="Backend" onClick={() => handleNavClick("What are your Backend Development skills?", ChatIntents.SKILLS_BACKEND)}>
                                                Node.js, PostgreSQL.
                                            </ListItem>
                                            <ListItem icon={<Palette className="w-4 h-4" />} title="Design" onClick={() => handleNavClick("What are your Design skills?", ChatIntents.SKILLS_DESIGN)}>
                                                Tailwind CSS, Figma.
                                            </ListItem>
                                            <ListItem icon={<Layers className="w-4 h-4" />} title="Other" onClick={() => handleNavClick("What are your Other Skills?", ChatIntents.SKILLS_OTHER)}>
                                                Teamwork, Communication
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* 4. EXPERIENCES: Work History, Education */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Experiences</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                            <ListItem title="Work History" onClick={() => handleNavClick("Tell me about your work history.", ChatIntents.WORK_HISTORY)}>
                                                Professional roles and companies.
                                            </ListItem>
                                            <ListItem title="Education" onClick={() => handleNavClick("What is your educational background?", ChatIntents.EDUCATION)}>
                                                Degrees and certifications.
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* RIGHT: Resume Button */}
                    <InteractiveHoverButton onClick={() => setResumeOpen(true)}>Contact me</InteractiveHoverButton>
                </div>
            </div>

            {/* Mobile Sidebar Component (Sheet on Mobile) */}
            {isMobile && <AppSidebar onNavClick={handleNavClick} />}

            {/* Resume / Contact Drawer */}
            <Drawer open={resumeOpen} onOpenChange={setResumeOpen}>
                <DrawerContent className="max-w-[450px] mx-auto rounded-t-xl">
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle>Get in Touch</DrawerTitle>
                            <DrawerDescription>Send me a message or download my resume.</DrawerDescription>
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
                                        placeholder="Type your message here..."
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
                            <Button variant="outline" className="w-full">
                                Download Resume
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
