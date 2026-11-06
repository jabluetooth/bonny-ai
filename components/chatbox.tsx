"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@/components/chat-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Bot } from "lucide-react";
import { ChromaVideo } from "@/components/ui/chroma-video";
import { SkillsSection } from "@/components/skills-section";
import { ProjectsSection } from "@/components/projects-section";
import { AboutSection } from "@/components/about-section";
import { ServicesSection } from "@/components/services-section";
import { ContactCta } from "@/components/contact-cta";
import { ExperiencesSection } from "@/components/experiences-section";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatIntents } from "@/lib/intents";

const FOLLOW_UPS: { label: string; prompt: string; intent?: string }[] = [
    { label: "Problems I solve", prompt: "What problems can you solve for my business?", intent: ChatIntents.SERVICES },
    { label: "Case studies", prompt: "Show me case studies with results.", intent: ChatIntents.PROJECTS_ALL },
    { label: "How you'd approach my problem", prompt: "How do you usually approach a new client project?" },
    { label: "Experience", prompt: "Walk me through your experience.", intent: ChatIntents.WORK_HISTORY },
    { label: "Get in touch", prompt: "I'd like to get in touch.", intent: ChatIntents.CONTACT },
];

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
    showServices: boolean;
    showContact: boolean;
}

// Pure function to parse message content for UI tags
function getMessageData(content: string): ParsedMessageData {
    const skillMatch = content.match(/\[\[(?:SHOW_)?SKILL:\s*(.*?)\]\]/);
    const categoryMatch = content.match(/\[\[(?:SHOW_)?CATEGORY:\s*(.*?)\]\]/);
    const experienceMatch = content.match(/\[\[(?:SHOW_)?EXPERIENCE:\s*(.*?)\]\]/);
    const projectMatch = content.match(/\[\[(?:SHOW_)?PROJECTS:\s*(.*?)\]\]/);

    const showAllSkills = /\[\[(?:SHOW_)?SKILLS\]\]/.test(content);
    const showProjects = !!projectMatch || /\[\[(?:SHOW_)?PROJECTS\]\]/.test(content);
    const showAbout = /\[\[(?:SHOW_)?ABOUT\]\]/.test(content);
    const showServices = /\[\[(?:SHOW_)?SERVICES\]\]/.test(content);
    const showContact = /\[\[(?:SHOW_)?CONTACT\]\]/.test(content);
    const showExperiences = !!experienceMatch || /\[\[(?:SHOW_)?EXPERIENCE\]\]/.test(content);

    const highlightSkill = skillMatch ? skillMatch[1] : undefined;
    const highlightCategory = categoryMatch ? categoryMatch[1] : undefined;
    const experienceCategory = experienceMatch ? experienceMatch[1].toLowerCase() : undefined;
    const projectCategory = projectMatch ? projectMatch[1].toLowerCase() : undefined;

    // Strip every [[...]] UI tag from the displayed text — including legacy
    // ones (INTERESTS, VISION, BACKGROUND) still stored in old conversations.
    // While a reply streams in, a tag can arrive in pieces ("[[SHOW_SK").
    // Drop an unfinished tag at the very end so it never flashes as text.
    const cleanContent = content
        .replace(/\[\[[^\]]*\]?$/, "")
        .replace(/\[\[[A-Z_]+(?::[^\]]*)?\]\]/g, "")
        .trim();

    const showSkills = !!highlightSkill || !!highlightCategory || showAllSkills;

    return { cleanContent, highlightSkill, highlightCategory, showSkills, showProjects, projectCategory, showExperiences, experienceCategory, showAbout, showServices, showContact };
}

// Renders **bold** segments; everything else is plain text.
function FormattedText({ text }: { text: string }) {
    return (
        <>
            {text.split(/(\*\*.*?\*\*)/).map((part, idx) =>
                part.startsWith("**") && part.endsWith("**")
                    ? <strong key={idx} className="font-semibold">{part.slice(2, -2)}</strong>
                    : <span key={idx}>{part}</span>
            )}
        </>
    );
}

function Block({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.4,
                scale: { type: "spring", visualDuration: 0.4, bounce: 0.25 },
            }}
            className={cn("mt-1 w-full grid grid-cols-1 min-w-0 overflow-hidden rounded-xl bg-background/50 backdrop-blur-sm", className)}
        >
            {children}
        </motion.div>
    );
}

function BotAvatar() {
    return (
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 border-none shadow-none rounded-none bg-transparent">
            <AvatarImage src="/bot-avatar.png" alt="" className="object-contain" />
            <AvatarFallback className="bg-primary/10 text-primary"><Bot size={14} /></AvatarFallback>
        </Avatar>
    );
}

export function Chatbox() {
    const { sendMessage, messages, isLoading, isChatDisabled } = useChat();
    const [input, setInput] = useState("");
    const [typedMessages, setTypedMessages] = useState<Set<string | number>>(new Set());
    const [dismissedSuggestions, setDismissedSuggestions] = useState(false);

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
        setInput("");
        if (messages.length > 0) setDismissedSuggestions(true);
        await sendMessage(msg);
    };

    const handlePrompt = async (prompt: string, intent?: string) => {
        if (messages.length > 0) setDismissedSuggestions(true);
        await sendMessage(prompt, intent);
    };

    const parsedMessages = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return messages.map((msg: any) => ({
            ...msg,
            parsed: getMessageData(msg.content)
        }));
    }, [messages]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);
    const composerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        // Scroll only the message list. scrollIntoView would also scroll the
        // page and push the input box below the fold.
        const el = scrollContainerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // "Magnet" the input box: when the conversation starts, a new message
    // arrives, or a reply finishes, snap the page so the composer sits at the
    // bottom of the screen. Keyed on milestones, not every streamed token.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastStreaming = !!(messages[messages.length - 1] as any)?.streaming;
    useEffect(() => {
        if (messages.length === 0) return;
        const id = requestAnimationFrame(() => {
            composerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        });
        return () => cancelAnimationFrame(id);
    }, [messages.length, isLoading, lastStreaming]);

    // When a reply finishes, put the cursor back in the input on devices with
    // a mouse. Skipped on touch screens so the keyboard doesn't pop open.
    useEffect(() => {
        if (isLoading || lastStreaming || messages.length === 0) return;
        if (window.matchMedia("(pointer: fine)").matches) {
            chatInputRef.current?.focus({ preventScroll: true });
        }
    }, [isLoading, lastStreaming, messages.length]);

    // A new visitor's session starts with their first message (see chat-provider).
    const inputDisabled = isLoading || isChatDisabled;

    // 2. Hero / Initial State
    if (messages.length === 0) {
        return (
            <>
                <div className="relative w-full max-w-[20rem] sm:max-w-md md:max-w-xl aspect-video mx-auto translate-y-6 -mb-6 md:translate-y-10 md:-mb-10">
                    <ChromaVideo
                        src="/gs.mp4"
                        className="w-full h-full"
                        similarity={35}
                        smoothness={45}
                        greenColor={{ r: 0, g: 255, b: 0 }}
                    />
                </div>

                <div className="w-full max-w-lg mx-auto px-1 sm:px-4 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="relative flex items-center w-full"
                    >
                        <label htmlFor="hero-chat-input" className="sr-only">Describe your problem or ask a question</label>
                        <Input
                            id="hero-chat-input"
                            name="message"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isChatDisabled ? "Message limit reached." : "Ask me anything..."}
                            className="w-full h-12 sm:h-14 pl-5 sm:pl-6 pr-14 sm:pr-16 rounded-full text-base sm:text-lg shadow-lg border-muted-foreground/20 bg-background focus-visible:ring-1 focus-visible:ring-primary/50 transition-all hover:shadow-xl relative z-10"
                            disabled={inputDisabled}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={inputDisabled || !input.trim()}
                            className="absolute right-1.5 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 z-20"
                        >
                            <ArrowRight size={20} />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </>
        );
    }

    // 3. Chat Interface State
    return (
        <>
            <div className="w-full h-full max-w-4xl flex flex-col min-h-0 animate-in fade-in duration-300">
                {/* Messages Area - a bounded box that scrolls internally, so
                    a long conversation never grows the page. */}
                <div className="flex-1 min-h-0">
                    <div ref={scrollContainerRef} className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="flex flex-col gap-4 sm:gap-6 pb-2 px-1 sm:px-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {parsedMessages.map((msg: any, i) => {
                                const { cleanContent, highlightSkill, highlightCategory, showSkills, showProjects, projectCategory, showExperiences, experienceCategory, showAbout, showServices, showContact } = msg.parsed as ParsedMessageData;

                                const isBot = msg.role === 'bot';
                                const isLatestBotMessage = isBot && i === parsedMessages.length - 1;
                                const isAdmin = msg.role === 'admin' || msg.sender_type === 'admin';
                                const isUser = msg.role === 'user';

                                const messageId = msg.id || i;
                                const hasTyped = typedMessages.has(messageId);
                                // Streamed replies already arrive a few words at a time, so
                                // they render as-is; the typing effect is only for replies
                                // that arrive whole (static answers).
                                const isStreamed = typeof msg.id === 'string' && msg.id.startsWith('bot-');
                                const isStreaming = !!msg.streaming;
                                const shouldAnimate = isLatestBotMessage && !hasTyped && !isStreamed;

                                return (
                                    <div key={msg.id || i} className={`flex gap-2 sm:gap-3 w-full min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
                                        {isBot && <BotAvatar />}

                                        <div className={`flex flex-col gap-2 w-full min-w-0 ${isUser ? "items-end" : "items-start"}`}>
                                            {cleanContent && (
                                                <div
                                                    className={cn(
                                                        "rounded-[20px] px-4 sm:px-5 py-2.5 text-[15px] shadow-sm leading-relaxed break-words whitespace-pre-wrap [word-break:break-word] min-w-0 max-w-[88%] sm:max-w-[85%] overflow-hidden",
                                                        isUser && "bg-gradient-to-br from-blue-600/90 to-blue-600/70 backdrop-blur-md border border-blue-400/30 shadow-xl text-white rounded-br-none",
                                                        isAdmin && "bg-gradient-to-br from-red-600/90 to-red-600/70 backdrop-blur-md border border-red-400/30 shadow-xl text-white rounded-bl-none",
                                                        isBot && "bg-gradient-to-br from-muted/80 to-muted/40 backdrop-blur-md border border-white/10 shadow-xl text-foreground rounded-bl-none"
                                                    )}
                                                >
                                                                                                        {shouldAnimate ? (
                                                        <TypingAnimation
                                                            text={cleanContent}
                                                            duration={1}
                                                            className="font-normal"
                                                            onComplete={() => handleTypingComplete(messageId)}
                                                        />
                                                    ) : (
                                                        <FormattedText text={cleanContent} />
                                                    )}
                                                </div>
                                            )}

                                            {/* UI blocks render under the bot's text once it has finished typing */}
                                            {isBot && !isStreaming && (!shouldAnimate || !cleanContent) && (
                                                <>
                                                    {msg.component && <Block>{msg.component}</Block>}
                                                    {!msg.component && showServices && <Block className="bg-transparent backdrop-blur-none"><ServicesSection /></Block>}
                                                    {!msg.component && showProjects && <Block><ProjectsSection category={projectCategory} /></Block>}
                                                    {!msg.component && showSkills && <Block><SkillsSection highlightSkill={highlightSkill} highlightCategory={highlightCategory} /></Block>}
                                                    {!msg.component && showExperiences && <Block><ExperiencesSection category={experienceCategory} scrollContainer={scrollContainerRef} /></Block>}
                                                    {!msg.component && showAbout && <Block className="overflow-visible py-4"><AboutSection /></Block>}
                                                    {!msg.component && showContact && <Block className="overflow-visible bg-transparent backdrop-blur-none"><ContactCta /></Block>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex gap-3 max-w-[85%] items-end" role="status" aria-label="Typing">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 relative overflow-hidden">
                                        <ChromaVideo
                                            src="/botpng000.mp4"
                                            poster="/bot-avatar.png"
                                            className="w-full h-full"
                                            similarity={35}
                                            smoothness={50}
                                            greenColor={{ r: 0, g: 255, b: 0 }}
                                            maxResolution={100}
                                        />
                                    </div>
                                    <div className="bg-muted text-foreground rounded-[20px] rounded-bl-none px-5 py-4 flex gap-1 items-center shadow-sm">
                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>

                {/* Composer */}
                <div ref={composerRef} className="pt-2 sm:pt-3 pb-3 sm:pb-6 shrink-0 px-1 sm:px-4 scroll-mb-3">
                    <AnimatePresence>
                        {!dismissedSuggestions && !isChatDisabled && (
                            <motion.div
                                key="suggestions"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="w-full pb-2"
                            >
                                <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                    {FOLLOW_UPS.map((s) => (
                                        <button
                                            key={s.label}
                                            type="button"
                                            onClick={() => handlePrompt(s.prompt, s.intent)}
                                            disabled={isLoading}
                                            className="shrink-0 rounded-full border border-border/40 bg-background/60 backdrop-blur-sm px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="relative flex items-center w-full"
                    >
                        <label htmlFor="chat-input" className="sr-only">Message</label>
                        <Input
                            ref={chatInputRef}
                            id="chat-input"
                            name="message"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => {
                                // Snap the input into view once the on-screen
                                // keyboard finishes opening.
                                setTimeout(() => {
                                    chatInputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                                }, 300);
                            }}
                            placeholder={isChatDisabled ? "Message limit reached." : "Type a message..."}
                            className="w-full h-12 sm:h-14 pl-5 sm:pl-6 pr-14 sm:pr-16 rounded-full shadow-md border-border/40 bg-background/80 backdrop-blur-md focus-visible:ring-1 focus-visible:ring-primary/30 transition-shadow hover:shadow-lg text-base sm:text-lg relative z-10"
                            disabled={inputDisabled}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={inputDisabled || !input.trim()}
                            className="absolute right-1.5 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 z-20"
                        >
                            <ArrowRight size={20} />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                    {isChatDisabled && (
                        <p className="text-center text-xs text-muted-foreground mt-2.5">
                            Message limit reached. Use <strong className="text-foreground/70">Work with me</strong> in the navigation to reach me directly.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
