"use client"

import * as React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
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
    Terminal
} from "lucide-react"

// Unified chat trigger function
function openChat(topic: string) {
    console.log("Opening chat with topic:", topic)
}

export function PortfolioNavbar() {
    const [resumeOpen, setResumeOpen] = useState(false)

    return (
        <header className="w-full sticky top-0 bg-background/70 backdrop-blur-sm border-b z-50 transition-all duration-300">
            <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">

                {/* LEFT: Avatar */}
                <Avatar onClick={() => openChat("home")} className="cursor-pointer hover:scale-105 transition-transform">
                    <AvatarImage src="/placeholder.png" alt="Profile" />
                    <AvatarFallback>🙂</AvatarFallback>
                </Avatar>

                {/* CENTER: Navigation Menu */}
                <NavigationMenu>
                    <NavigationMenuList>
                        {/* 1. ABOUT */}
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>About</NavigationMenuTrigger>
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
                            <NavigationMenuTrigger>Projects</NavigationMenuTrigger>
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
                            <NavigationMenuTrigger>Skills</NavigationMenuTrigger>
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
                            <NavigationMenuTrigger>Experiences</NavigationMenuTrigger>
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
