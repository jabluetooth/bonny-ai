"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@/components/chat-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, ArrowRight } from "lucide-react";
import { WelcomeModal } from "./welcome-modal";
import { SkillsSection } from "@/components/skills-section";
import { ProjectsSection } from "@/components/projects-section";
import { AboutSection } from "@/components/about-section";
import { LoadingScreen } from "@/components/loading-screen";
import { InterestsSection } from "@/components/interests-section";
import { VisionSection } from "@/components/vision-section";

import { ExperiencesSection } from "@/components/experiences-section";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BackgroundCards } from "@/components/background-cards";
import { ChromaVideo } from "@/components/ui/chroma-video";

// Types for parsed message data
interface ParsedMessageData {
    cleanContent: string;
    highlightSkill: string | undefined;
    highlightCategory: string | undefined;
    showSkills: boolean;
    showProjects: boolean;
    projectCategory: string | undefined;
    showExperiences: boolean;
    experienceCategory: string | undefined;
    showAbout: boolean;
    showInterests: boolean;
    showVision: boolean;
    showBackground: boolean;
}

// Pure function to parse message content for UI tags - moved outside component to avoid recreation
function getMessageData(content: string): ParsedMessageData {
    const skillMatch = content.match(/\[\[(?:SHOW_)?SKILL:\s*(.*?)\]\]/);
    const categoryMatch = content.match(/\[\[(?:SHOW_)?CATEGORY:\s*(.*?)\]\]/);
    const experienceMatch = content.match(/\[\[(?:SHOW_)?EXPERIENCE:\s*(.*?)\]\]/);
    const projectMatch = content.match(/\[\[(?:SHOW_)?PROJECTS:\s*(.*?)\]\]/);

    const showAllSkills = /\[\[(?:SHOW_)?SKILLS\]\]/.test(content);
    const showProjects = !!projectMatch || /\[\[(?:SHOW_)?PROJECTS\]\]/.test(content);
    const showAbout = /\[\[(?:SHOW_)?ABOUT\]\]/.test(content);
    const showInterests = /\[\[(?:SHOW_)?INTERESTS\]\]/.test(content);
    const showVision = /\[\[(?:SHOW_)?VISION\]\]/.test(content);
    const showBackground = /\[\[(?:SHOW_)?BACKGROUND\]\]/.test(content);
    const showExperiences = !!experienceMatch || /\[\[(?:SHOW_)?EXPERIENCE\]\]/.test(content);

    const highlightSkill = skillMatch ? skillMatch[1] : undefined;
    const highlightCategory = categoryMatch ? categoryMatch[1] : undefined;
    const experienceCategory = experienceMatch ? experienceMatch[1].toLowerCase() : undefined;
    const projectCategory = projectMatch ? projectMatch[1].toLowerCase() : undefined;

    // Clean the tag out of the displayed text (remove all types of tags)
    let cleanContent = content.replace(/\[\[(?:SHOW_)?SKILL:\s*.*?\]\]/g, "");
    cleanContent = cleanContent.replace(/\[\[(?:SHOW_)?CATEGORY:\s*.*?\]\]/g, "");
    cleanContent = cleanContent.replace(/\[\[(?:SHOW_)?EXPERIENCE:\s*.*?\]\]/g, "");
    cleanContent = cleanContent.replace(/\[\[(?:SHOW_)?PROJECTS:\s*.*?\]\]/g, "");
    cleanContent = cleanContent
        .replace(/\[\[(?:SHOW_)?SKILLS\]\]/g, "")
        .replace(/\[\[(?:SHOW_)?PROJECTS\]\]/g, "")
        .replace(/\[\[(?:SHOW_)?EXPERIENCE\]\]/g, "")
        .replace(/\[\[(?:SHOW_)?ABOUT\]\]/g, "")
        .replace(/\[\[(?:SHOW_)?INTERESTS\]\]/g, "")
        .replace(/\[\[(?:SHOW_)?VISION\]\]/g, "")
        .replace(/\[\[(?:SHOW_)?BACKGROUND\]\]/g, "")
        .trim();

    const showSkills = !!highlightSkill || !!highlightCategory || showAllSkills;

    return { cleanContent, highlightSkill, highlightCategory, showSkills, showProjects, projectCategory, showExperiences, experienceCategory, showAbout, showInterests, showVision, showBackground };
}

export function Chatbox() {
    const { conversationId, sendMessage, messages, isLoading, isWelcomeOpen, isChatDisabled } = useChat();
    const [input, setInput] = useState("");
    const [typedMessages, setTypedMessages] = useState<Set<string | number>>(new Set());

    const handleTypingComplete = (id: string | number) => {
        setTypedMessages(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };




    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput(""); // Immediate clear
        await sendMessage(msg);
    };

    // Memoize parsed message data - only re-parse when messages array changes
    const parsedMessages = useMemo(() => {
        return messages.map((msg: any) => ({
            ...msg,
            parsed: getMessageData(msg.content)
        }));
    }, [messages]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Lock body scroll when chat is active
    useEffect(() => {
        if (messages.length > 0) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [messages.length]);

    // 1. Loading State (Global / Start)
    if (isLoading && messages.length === 0) {
        return <LoadingScreen />;
    }

    // 2. Hero / Initial State
    if (messages.length === 0) {
        return (
            <>
                <WelcomeModal />

                <div className="relative w-full max-w-2xl aspect-video mb-0 translate-y-12 -mb-12">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                    >
                        {/* WebM with alpha for Chrome/Firefox/Edge */}
                        <source src="/newlandingdefault.webm" type="video/webm" />
                        {/* ProRes 4444 with alpha for iOS/Safari */}
                        <source src="/newlanding_ios.mp4" type="video/mp4" />
                    </video>
                </div>

                <div className="w-full max-w-lg mx-auto px-4 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="relative flex items-center w-full"
                    >
                        <Input
                            id="hero-chat-input"
                            name="message"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isChatDisabled ? "Message limit reached." : "Ask me anything..."}
                            className="w-full h-14 pl-6 pr-16 rounded-full text-lg shadow-lg border-muted-foreground/20 bg-background focus-visible:ring-1 focus-visible:ring-primary/50 transition-all hover:shadow-xl relative z-10"
                            disabled={!conversationId || isLoading || isChatDisabled}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!conversationId || isLoading || !input.trim() || isChatDisabled}
                            className="absolute right-1.5 h-11 w-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 z-20"
                        >
                            <ArrowRight size={20} />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </>
        );
    }

    // 2. Chat Interface State (Minimalist)
    return (
        <>
            <WelcomeModal />
            <div className="w-full max-w-3xl flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
                {/* Messages Area - Flexible & Transparent */}
                <div className="flex-1 overflow-hidden relative mb-4">
                    <ScrollArea className="h-full w-full" viewportId="chat-scroll-area">
                        <div className="flex flex-col flex-1 justify-end gap-6 pb-2 px-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {parsedMessages.map((msg: any, i) => {
                                // Use pre-parsed data from memoized array
                                const { cleanContent, highlightSkill, highlightCategory, showSkills, showProjects, projectCategory, showExperiences, experienceCategory, showAbout, showInterests, showVision, showBackground } = msg.parsed;

                                const isLatestBotMessage = msg.role === 'bot' && i === parsedMessages.length - 1;
                                const isAdmin = msg.role === 'admin' || (msg as any).sender_type === 'admin';
                                const isUser = msg.role === 'user';

                                const messageId = msg.id || i;
                                const hasTyped = typedMessages.has(messageId);
                                const shouldAnimate = isLatestBotMessage && !hasTyped;

                                // Heuristic for About Section if not explicitly tagged
                                const prevMsg = parsedMessages[i - 1];
                                const showAboutHeuristic = prevMsg && prevMsg.role === 'user' && prevMsg.content.includes("Tell me about yourself");

                                return (
                                    <div key={msg.id || i} className={`flex gap-3 w-full mb-6 min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
                                        {/* Bot Avatar (Only for bot) */}
                                        {msg.role === "bot" && (
                                            <Avatar className="h-10 w-10 shrink-0 border-none shadow-none rounded-none bg-transparent">
                                                <AvatarImage src="/bot-avatar.png" className="object-contain" />
                                                <AvatarFallback className="bg-primary/10 text-primary"><Bot size={14} /></AvatarFallback>
                                            </Avatar>
                                        )}
                                        {/* Admin Avatar fallback or distinctive icon could go here, for now keeping it simple */}

                                        {/* Message Content Column (Bubble + Component) */}
                                        <div className={`flex flex-col gap-2 w-full min-w-0 ${isUser ? "items-end" : "items-start"}`}>
                                            <div
                                                className={`rounded-[20px] px-5 py-2.5 text-[15px] shadow-sm leading-relaxed break-words whitespace-pre-wrap [word-break:break-word] min-w-0 max-w-[85%] overflow-hidden ${isUser
                                                    ? "bg-gradient-to-br from-blue-600/90 to-blue-600/70 backdrop-blur-md border border-blue-400/30 shadow-xl text-white rounded-br-none"
                                                    : isAdmin
                                                        ? "bg-gradient-to-br from-red-600/90 to-red-600/70 backdrop-blur-md border border-red-400/30 shadow-xl text-white rounded-bl-none" // Admin Red
                                                        : "bg-gradient-to-br from-muted/80 to-muted/40 backdrop-blur-md border border-white/10 shadow-xl text-foreground rounded-bl-none"
                                                    }`}
                                            >
                                                {shouldAnimate ? (
                                                    <TypingAnimation
                                                        text={cleanContent}
                                                        duration={1}
                                                        className="font-normal"
                                                        onComplete={() => handleTypingComplete(messageId)}
                                                    />
                                                ) : (
                                                    /* Format message with BOLD support */
                                                    cleanContent.split(/(\*\*.*?\*\*)/).map((part: string, idx: number) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return <strong key={idx}>{part.slice(2, -2)}</strong>;
                                                        }
                                                        return <span key={idx}>{part}</span>;
                                                    })
                                                )}
                                            </div>

                                            {/* Component Display - Outside Message Bubble */}
                                            {!shouldAnimate && (
                                                <>
                                                    {/* 1. Explicit Component (e.g. forced via code) */}
                                                    {msg.component && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{
                                                                duration: 0.4,
                                                                scale: { type: "spring", visualDuration: 0.4, bounce: 0.25 },
                                                            }}
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0 overflow-hidden rounded-xl bg-background/50 backdrop-blur-sm"
                                                        >
                                                            {msg.component}
                                                        </motion.div>
                                                    )}

                                                    {/* 2. Skills Section (Triggered by Tag or Heuristic) */}
                                                    {!msg.component && showSkills && msg.role === 'bot' && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{
                                                                duration: 0.4,
                                                                scale: { type: "spring", visualDuration: 0.4, bounce: 0.25 },
                                                            }}
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0 overflow-hidden rounded-xl bg-background/50 backdrop-blur-sm"
                                                        >
                                                            <SkillsSection highlightSkill={highlightSkill} highlightCategory={highlightCategory} />
                                                        </motion.div>
                                                    )}

                                                    {/* 3. Projects Section (Triggered by Tag) */}
                                                    {msg.role === 'bot' && showProjects && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{
                                                                duration: 0.4,
                                                                scale: { type: "spring", visualDuration: 0.4, bounce: 0.25 },
                                                            }}
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0 overflow-hidden rounded-xl bg-background/50 backdrop-blur-sm"
                                                        >
                                                            <ProjectsSection category={projectCategory} />
                                                        </motion.div>
                                                    )}

                                                    {/* 4. Experiences Section (Triggered by Tag) */}
                                                    {msg.role === 'bot' && showExperiences && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{
                                                                duration: 0.4,
                                                                scale: { type: "spring", visualDuration: 0.4, bounce: 0.20 },
                                                            }}
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0 overflow-hidden rounded-xl bg-background/50 backdrop-blur-sm"
                                                        >
                                                            <ExperiencesSection category={experienceCategory} />
                                                        </motion.div>
                                                    )}

                                                    {/* 5. About Section (Triggered by Tag or Heuristic) */}
                                                    {msg.role === 'bot' && (showAbout || showAboutHeuristic) && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{
                                                                duration: 0.4,
                                                                scale: { type: "spring", visualDuration: 0.4, bounce: 0.20 },
                                                            }}
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0 rounded-xl bg-background/50 backdrop-blur-sm overflow-visible py-4"
                                                        >
                                                            <AboutSection />
                                                        </motion.div>
                                                    )}

                                                    {/* 6. Interests Section (Triggered by Tag) */}
                                                    {msg.role === 'bot' && showInterests && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{
                                                                duration: 0.4,
                                                                scale: { type: "spring", visualDuration: 0.4, bounce: 0.20 },
                                                            }}
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0"
                                                        >
                                                            <InterestsSection />
                                                        </motion.div>
                                                    )}

                                                    {/* 7. Vision Section (Triggered by Tag) */}
                                                    {msg.role === 'bot' && showVision && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{
                                                                duration: 0.4,
                                                                scale: { type: "spring", visualDuration: 0.4, bounce: 0.20 },
                                                            }}
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0"
                                                        >
                                                            <VisionSection />
                                                        </motion.div>
                                                    )}

                                                    {/* 8. Background Section (Triggered by Tag) */}
                                                    {msg.role === 'bot' && showBackground && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{
                                                                duration: 0.4,
                                                                scale: { type: "spring", visualDuration: 0.4, bounce: 0.20 },
                                                            }}
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0 rounded-xl bg-background/50 backdrop-blur-sm overflow-visible py-4"
                                                        >
                                                            <BackgroundCards />
                                                        </motion.div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex gap-3 max-w-[85%] items-end">
                                    <div className="h-10 w-10 shrink-0 relative overflow-hidden">
                                        <ChromaVideo
                                            src="/botloading.mp4"
                                            poster="/bot-avatar.png"
                                            className="w-full h-full"
                                            similarity={28}
                                            smoothness={10}
                                            greenColor={{ r: 0, g: 255, b: 0 }}
                                        />
                                    </div>
                                    <div className="bg-muted text-foreground rounded-[20px] rounded-bl-none px-5 py-4 flex gap-1 items-center shadow-sm">
                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            {/* Invisible div to scroll to */}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </div >

                {/* Input Area - Wide & Clean */}
                < div className="w-full" >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="relative flex items-center w-full rounded-full transition-all duration-300"
                    >
                        <Input
                            id="chat-input"
                            name="message"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => {
                                setTimeout(scrollToBottom, 300); // Delay for keyboard animation
                            }}
                            placeholder={isChatDisabled ? "Message limit reached." : "Type a message..."}
                            className="w-full h-14 pl-6 pr-16 rounded-full shadow-md border-border/40 bg-background/80 backdrop-blur-md focus-visible:ring-1 focus-visible:ring-primary/30 transition-shadow hover:shadow-lg text-lg relative z-10"
                            disabled={!conversationId || isLoading || isChatDisabled}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!conversationId || isLoading || !input.trim() || isChatDisabled}
                            className="absolute right-1.5 h-11 w-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 z-20"
                        >
                            <ArrowRight size={20} />
                            <span className="sr-only">Send</span>
                        </Button>


                    </form>
                </div >
            </div >
        </>
    );
}
