"use client";

import { useState, useRef, useEffect } from "react";
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
import { InterestsSection } from "@/components/interests-section";
import { VisionSection } from "@/components/vision-section";

import { ExperiencesSection } from "@/components/experiences-section";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { BorderBeam } from "@/components/ui/border-beam";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Chatbox() {
    const { conversationId, sendMessage, messages, isLoading, welcomePlaceholder, isWelcomeOpen, isChatDisabled } = useChat();
    const [input, setInput] = useState("");
    const [isInputFocused, setIsInputFocused] = useState(false);
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

    // Helper to parse content for skill tags
    const getMessageData = (content: string) => {
        const skillMatch = content.match(/\[\[SKILL:\s*(.*?)\]\]/);
        const categoryMatch = content.match(/\[\[CATEGORY:\s*(.*?)\]\]/);
        const experienceMatch = content.match(/\[\[SHOW_EXPERIENCE:\s*(.*?)\]\]/);
        const projectMatch = content.match(/\[\[SHOW_PROJECTS:\s*(.*?)\]\]/);

        const showAllSkills = content.includes("[[SHOW_SKILLS]]");
        const showProjects = !!projectMatch || content.includes("[[SHOW_PROJECTS]]");
        const showAbout = content.includes("[[SHOW_ABOUT]]");
        const showInterests = content.includes("[[SHOW_INTERESTS]]");
        const showVision = content.includes("[[SHOW_VISION]]");
        // Fallback for old tag or if specific tag missing, though API now sends specific
        const showExperiences = !!experienceMatch || content.includes("[[SHOW_EXPERIENCE]]");

        const highlightSkill = skillMatch ? skillMatch[1] : undefined;
        const highlightCategory = categoryMatch ? categoryMatch[1] : undefined;
        const experienceCategory = experienceMatch ? experienceMatch[1].toLowerCase() : undefined;
        const projectCategory = projectMatch ? projectMatch[1].toLowerCase() : undefined;

        // Clean the tag out of the displayed text (remove all types of tags)
        let cleanContent = content.replace(/\[\[SKILL:\s*.*?\]\]/, "");
        cleanContent = cleanContent.replace(/\[\[CATEGORY:\s*.*?\]\]/, "");
        cleanContent = cleanContent.replace(/\[\[SHOW_EXPERIENCE:\s*.*?\]\]/, "");
        cleanContent = cleanContent.replace(/\[\[SHOW_PROJECTS:\s*.*?\]\]/, "");
        cleanContent = cleanContent.replace("[[SHOW_SKILLS]]", "").replace("[[SHOW_PROJECTS]]", "").replace("[[SHOW_EXPERIENCE]]", "").replace("[[SHOW_ABOUT]]", "").replace("[[SHOW_INTERESTS]]", "").replace("[[SHOW_VISION]]", "").trim();

        // Show skills if tag exists OR context keywords found (heuristic fallback)
        const showSkills = !!highlightSkill || !!highlightCategory || showAllSkills;

        return { cleanContent, highlightSkill, highlightCategory, showSkills, showProjects, projectCategory, showExperiences, experienceCategory, showAbout, showInterests, showVision };
    };

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

    // 1. Hero / Initial State
    if (messages.length === 0) {
        return (
            <>
                <WelcomeModal />
                <div className="w-full max-w-lg px-4 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
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
                            placeholder={isChatDisabled ? "Message limit reached." : (isWelcomeOpen ? welcomePlaceholder : "Ask me anything...")}
                            className="w-full h-14 pl-6 pr-16 rounded-full text-lg shadow-lg border-muted-foreground/20 bg-background focus-visible:ring-1 focus-visible:ring-primary/50 transition-all hover:shadow-xl"
                            disabled={!conversationId || isLoading || isChatDisabled}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!conversationId || isLoading || !input.trim() || isChatDisabled}
                            className="absolute right-1.5 h-11 w-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
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
                        <div className="flex flex-col flex-1 justify-end gap-6 pb-12 px-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {messages.map((msg: any, i) => {
                                const { cleanContent, highlightSkill, highlightCategory, showSkills, showProjects, projectCategory, showExperiences, experienceCategory, showAbout, showInterests, showVision } = getMessageData(msg.content);

                                const isLatestBotMessage = msg.role === 'bot' && i === messages.length - 1;
                                const messageId = msg.id || i;
                                const hasTyped = typedMessages.has(messageId);
                                const shouldAnimate = isLatestBotMessage && !hasTyped;

                                // Heuristic for About Section if not explicitly tagged
                                const prevMsg = messages[i - 1];
                                const showAboutHeuristic = prevMsg && prevMsg.role === 'user' && prevMsg.content.includes("Tell me about yourself");

                                return (
                                    <div key={msg.id || i} className={`flex gap-3 w-full mb-6 min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        {/* Bot Avatar (Only for bot) */}
                                        {msg.role === "bot" && (
                                            <Avatar className="h-8 w-8 shrink-0 border border-border/30 shadow-sm">
                                                <AvatarImage src="/bot-avatar.png" />
                                                <AvatarFallback className="bg-primary/10 text-primary"><Bot size={14} /></AvatarFallback>
                                            </Avatar>
                                        )}

                                        {/* Message Content Column (Bubble + Component) */}
                                        <div className={`flex flex-col gap-2 w-full min-w-0 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                            <div
                                                className={`rounded-[20px] px-5 py-2.5 text-[15px] shadow-sm leading-relaxed break-words whitespace-pre-wrap [word-break:break-word] min-w-0 max-w-[85%] overflow-hidden ${msg.role === "user"
                                                    ? "bg-[#0084ff] text-white rounded-br-none" // Messenger Blue
                                                    : "bg-muted text-foreground rounded-bl-none" // Messenger Gray
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
                                                    cleanContent.split(/(\*\*.*?\*\*)/).map((part, idx) => {
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
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0 rounded-xl bg-background/50 backdrop-blur-sm overflow-visible py-4"
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
                                                            className="mt-1 w-full grid grid-cols-1 min-w-0 rounded-xl bg-background/50 backdrop-blur-sm overflow-visible py-4"
                                                        >
                                                            <VisionSection />
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
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className="bg-primary/10 text-primary"><Bot size={14} /></AvatarFallback>
                                    </Avatar>
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
                </div>

                {/* Input Area - Wide & Clean */}
                <div className="w-full">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className={cn(
                            "relative flex items-center w-full rounded-full transition-all duration-300",
                            isInputFocused ? "overflow-hidden" : ""
                        )}
                    >
                        <Input
                            id="chat-input"
                            name="message"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
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

                        {/* Border Beams - Active on Focus */}
                        {isInputFocused && (
                            <>
                                <BorderBeam
                                    duration={6}
                                    size={400}
                                    radius={100}
                                    colorFrom="transparent"
                                    colorTo="#ef4444" // red-500
                                    className="from-transparent via-red-500 to-transparent pointer-events-none z-30"
                                />
                                <BorderBeam
                                    duration={6}
                                    delay={3}
                                    size={400}
                                    radius={100}
                                    borderWidth={2}
                                    colorFrom="transparent"
                                    colorTo="#3b82f6" // blue-500
                                    className="from-transparent via-blue-500 to-transparent pointer-events-none z-30"
                                />
                            </>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
