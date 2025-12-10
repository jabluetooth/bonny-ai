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
    Terminal,
    ChevronDown, // Import icons
    ChevronUp
} from "lucide-react"

// Unified chat trigger function
import { SkillsSection } from "@/components/skills-section"

export function PortfolioNavbar() {
    const [resumeOpen, setResumeOpen] = useState(false)
    const { messages, isWelcomeOpen, startChat, addMessage, conversationId } = useChat()
    const [isOpen, setIsOpen] = useState(true)
    const [isHoveringTrigger, setIsHoveringTrigger] = useState(false)
    const [navValue, setNavValue] = useState("")
    const prevMsgLength = React.useRef(messages.length)

    // Unified chat trigger function
    const openChat = async (topic: string) => {
        // Ensure chat is started
        if (!conversationId) {
            await startChat("Guest") // Or prompt? Assuming guest for now if clicking nav
        }

        if (topic === "skills") {
            addMessage({
                role: 'user',
                content: "Tell me about your tech stack and skills."
            })
            // Small delay to simulate thinking? Or instant.
            setTimeout(() => {
                addMessage({
                    role: 'bot',
                    content: "Here is a breakdown of my technical skills across different domains:",
                    component: <SkillsSection />
                })
            }, 600)
        } else {
            // Fallback for other topics (placeholder)
            console.log("Opening chat with topic:", topic)
        }

        // Close menu
        setNavValue("")
    }

    // Auto-collapse when chat starts (0 -> 1+) or resets (-> 0)
    useEffect(() => {
        // If we went from empty to having messages, auto-close
        if (prevMsgLength.current === 0 && messages.length > 0) {
            setIsOpen(false)
        }
        // If we cleared messages, auto-open
        else if (messages.length === 0) {
            setIsOpen(true)
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
                    "bg-background/70 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-auto",
                    isOpen ? "mt-0 opacity-100" : "-mt-16 opacity-0 pointer-events-none",
                    (resumeOpen || isWelcomeOpen) && "blur-sm"
                )}
            >
                <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 relative">

                    {/* LEFT: Avatar */}
                    <Avatar onClick={() => openChat("home")} className="cursor-pointer hover:scale-105 transition-transform">
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
                                                    onClick={() => openChat("about")}
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
                                        <ListItem title="Background" onClick={() => openChat("about")}>
                                            My journey and career path.
                                        </ListItem>
                                        <ListItem title="Interests" onClick={() => openChat("about")}>
                                            Hobbies and personal passions.
                                        </ListItem>
                                        <ListItem title="Contact" onClick={() => openChat("about")}>
                                            Get in touch directly.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* 2. PROJECTS */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Projects</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                        <ListItem title="Web Development" onClick={() => openChat("projects")}>
                                            Full-stack web applications.
                                        </ListItem>
                                        <ListItem title="Mobile Apps" onClick={() => openChat("projects")}>
                                            iOS and Android applications.
                                        </ListItem>
                                        <ListItem title="AI & ML" onClick={() => openChat("projects")}>
                                            Machine learning models.
                                        </ListItem>
                                        <ListItem title="Open Source" onClick={() => openChat("projects")}>
                                            Contributions to public repos.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* 3. SKILLS */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Skills</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                        <ListItem icon={<Code2 className="w-4 h-4" />} title="Frontend" onClick={() => openChat("skills")}>
                                            React, Next.js, TypeScript.
                                        </ListItem>
                                        <ListItem icon={<Database className="w-4 h-4" />} title="Backend" onClick={() => openChat("skills")}>
                                            Node.js, PostgreSQL.
                                        </ListItem>
                                        <ListItem icon={<Palette className="w-4 h-4" />} title="Design" onClick={() => openChat("skills")}>
                                            Tailwind CSS, Figma.
                                        </ListItem>
                                        <ListItem icon={<Terminal className="w-4 h-4" />} title="DevOps" onClick={() => openChat("skills")}>
                                            Docker, CI/CD pipelines.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* 4. EXPERIENCES */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-primary/10 focus:bg-primary/10 data-[state=open]:bg-primary/10 rounded-full hover:text-primary relative after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-[2px] after:bg-primary after:shadow-[0_0_8px_var(--primary)] after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-300">Experiences</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                        <ListItem title="Work History" onClick={() => openChat("experiences")}>
                                            Professional roles and companies.
                                        </ListItem>
                                        <ListItem title="Education" onClick={() => openChat("experiences")}>
                                            Degrees and certifications.
                                        </ListItem>
                                        <ListItem title="Volunteering" onClick={() => openChat("experiences")}>
                                            Community involvement.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                    {/* RIGHT: Resume Button */}
                    <Button onClick={() => setResumeOpen(true)}>Resume</Button>
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
