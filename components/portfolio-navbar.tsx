"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useChat } from "@/components/chat-provider" // Import chat context
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
    ChevronDown, // Import icons
    ChevronUp
} from "lucide-react"

// Unified chat trigger function
import { SkillsSection } from "@/components/skills-section"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { ChatIntents } from "@/lib/intents"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"

export function PortfolioNavbar() {
    const [resumeOpen, setResumeOpen] = useState(false)
    const { messages, isWelcomeOpen, startChat, addMessage, sendMessage, conversationId } = useChat()
    const [isOpen, setIsOpen] = useState(true)
    const [isHoveringTrigger, setIsHoveringTrigger] = useState(false)
    const [navValue, setNavValue] = useState("")
    const prevMsgLength = React.useRef(messages.length)

    const handleNavClick = async (query: string, intent?: string) => {
        // Ensure chat is started
        if (!conversationId) {
            await startChat("Guest")
        }
        sendMessage(query, intent)
        setNavValue("")
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
        <header className="w-full sticky top-0 z-40 transition-all duration-300 pointer-events-none">
            {/* Toggle Trigger (Only visible when chat is active/has messages, and menu is closed) */}
            {messages.length > 0 && !navValue && (
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

            <div
                className={cn(
                    "relative transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-auto",
                    isOpen ? "h-16 opacity-100" : "h-0 opacity-0 pointer-events-none overflow-hidden",
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
                <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 relative z-10">

                    {/* LEFT: Avatar */}
                    <Avatar onClick={() => handleNavClick("Hello! Tell me about this portfolio.")} className="cursor-pointer hover:scale-105 transition-transform">
                        <AvatarImage src="/placeholder.png" alt="Profile" />
                        <AvatarFallback>🙂</AvatarFallback>
                    </Avatar>

                    {/* CENTER: Navigation Menu */}
                    <NavigationMenu value={navValue} onValueChange={setNavValue} className="absolute left-1/2 transform -translate-x-1/2">
                        <NavigationMenuList className="flex items-center justify-center gap-1 bg-background/20 backdrop-blur-xl border border-white/10 shadow-sm rounded-full px-1.5 py-1">
                            {/* 1. ABOUT */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">About</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <a
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer"
                                                    onClick={() => handleNavClick("Tell me about yourself.", ChatIntents.ABOUT_ME)}
                                                >
                                                    <div className="mb-2 mt-4 text-lg font-medium">
                                                        Author/Developer
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground">
                                                        Learn more about the creator behind this portfolio.
                                                    </p>
                                                </a>
                                            </NavigationMenuLink>
                                        </li>
                                        <ListItem title="Background" onClick={() => handleNavClick("What is your professional background?", ChatIntents.WORK)}>
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

                            {/* 2. PROJECTS */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Projects</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                        <ListItem title="Web Development" onClick={() => handleNavClick("Show me your web development projects.", ChatIntents.PROJECTS)}>
                                            Full-stack web applications.
                                        </ListItem>
                                        <ListItem title="AI & ML" onClick={() => handleNavClick("Tell me about your AI and Machine Learning projects.", ChatIntents.PROJECTS)}>
                                            Machine learning models.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* 3. SKILLS */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Skills</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                        <ListItem icon={<Code2 className="w-4 h-4" />} title="Frontend" onClick={() => handleNavClick("What are your Frontend Development skills?", ChatIntents.SKILLS)}>
                                            React, Next.js, TypeScript.
                                        </ListItem>
                                        <ListItem icon={<Database className="w-4 h-4" />} title="Backend" onClick={() => handleNavClick("What are your Backend Development skills?", ChatIntents.SKILLS)}>
                                            Node.js, PostgreSQL.
                                        </ListItem>
                                        <ListItem icon={<Palette className="w-4 h-4" />} title="Design" onClick={() => handleNavClick("What are your Design skills?", ChatIntents.SKILLS)}>
                                            Tailwind CSS, Figma.
                                        </ListItem>
                                        <ListItem icon={<Users className="w-4 h-4" />} title="Soft Skills" onClick={() => handleNavClick("What are your Soft Skills?", ChatIntents.SKILLS)}>
                                            Teamwork, Communication
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* 4. EXPERIENCES */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Experiences</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                        <ListItem title="Work History" onClick={() => handleNavClick("Tell me about your work history.", ChatIntents.WORK)}>
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

                    {/* RIGHT: Resume Button */}
                    <InteractiveHoverButton onClick={() => setResumeOpen(true)}>Contact me</InteractiveHoverButton>
                </div>
            </div>

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
                                    <Input placeholder="Your Email" />
                                </div>
                                <div className="space-y-1">
                                    <Textarea placeholder="Type your message here..." className="min-h-[100px]" />
                                </div>
                                <Button className="w-full">Send Message</Button>
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
        </header>
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
