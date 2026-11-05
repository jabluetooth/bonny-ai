"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@/components/chat-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Briefcase, Layers, LineChart, Wrench } from "lucide-react";
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

// Starter prompts on the landing screen. Mixed on purpose: two for business
// owners, one that invites them to describe their own problem, one for
// recruiters.
const STARTERS: { icon: React.ReactNode; title: string; prompt: string; intent?: string }[] = [
    { icon: <Wrench size={18} />, title: "What problems do you solve?", prompt: "What problems can you solve for my business?", intent: ChatIntents.SERVICES },
    { icon: <LineChart size={18} />, title: "Show me results", prompt: "Show me case studies with results.", intent: ChatIntents.PROJECTS_ALL },
    { icon: <Layers size={18} />, title: "My team loses hours to manual work", prompt: "My team spends hours every week on manual, repetitive work. How would you fix that?" },
    { icon: <Briefcase size={18} />, title: "I'm hiring", prompt: "I'm hiring. Walk me through your experience.", intent: ChatIntents.WORK_HISTORY },
];

const FOLLOW_UPS: { label: string; prompt: string; intent?: string }[] = [
    { label: "Problems I solve", prompt: "What problems can you solve for my business?", intent: ChatIntents.SERVICES },
    { label: "Case studies", prompt: "Show me case studies with results.", intent: ChatIntents.PROJECTS_ALL },
    { label: "How you'd approach my problem", prompt: "How do you usually approach a new client project?" },
    { label: "Experience", prompt: "Walk me through your experience.", intent: ChatIntents.WORK_HISTORY },
    { label: "Get in touch", prompt: "I'd like to get in touch.", intent: ChatIntents.CONTACT },
];

const STATUS_LABELS: Record<string, string> = {
    available_fulltime: "Available for new roles and projects",
    available_parttime: "Available for part-time and project work",
    open_for_discussion: "Open to new conversations",
    busy: "Currently fully booked",
};

const DEFAULT_HEADLINE = "I build automation and AI systems that give your team hours back.";
const DEFAULT_SUBHEADLINE = "Tell me where your business is losing time or money. I'll explain how I'd fix it, with examples of what I've already delivered.";

interface HeroProfile {
    headline?: string | null;
    subheadline?: string | null;
    status?: string | null;
}

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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn("mt-1 w-full grid grid-cols-1 min-w-0 overflow-hidden rounded-xl border border-border/60 bg-background", className)}
        >
            {children}
        </motion.div>
    );
}

function BotAvatar() {
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold tracking-wide text-background" aria-hidden>
            FH
        </div>
    );
}

function useHeroProfile(): HeroProfile | null {
    const [profile, setProfile] = useState<HeroProfile | null>(null);
    useEffect(() => {
        fetch("/api/about/author")
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => setProfile(json?.data ?? {}))
            .catch(() => setProfile({}));
    }, []);
    return profile;
}

export function Chatbox() {
    const { sendMessage, messages, isLoading, isChatDisabled } = useChat();
    const [input, setInput] = useState("");
    const [typedMessages, setTypedMessages] = useState<Set<string | number>>(new Set());
    const [dismissedSuggestions, setDismissedSuggestions] = useState(false);
    const heroProfile = useHeroProfile();

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

    const scrollToBottom = () => {
        // block: "end" aligns the target at the bottom of the message list's
        // own overflow-y-auto box, not the page.
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // A new visitor's session starts with their first message (see chat-provider).
    const inputDisabled = isLoading || isChatDisabled;

    // 2. Hero / Initial State
    if (messages.length === 0) {
        const statusLabel = heroProfile?.status ? STATUS_LABELS[heroProfile.status] : undefined;

        return (
            <>
                <div className="w-full max-w-3xl mx-auto px-4 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-4 text-center">
                        {statusLabel && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                                <span className={cn("h-1.5 w-1.5 rounded-full", heroProfile?.status === "busy" ? "bg-red-500" : "bg-emerald-500")} />
                                {statusLabel}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-balance">
                            {heroProfile?.headline || DEFAULT_HEADLINE}
                        </h1>
                        <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground text-balance">
                            {heroProfile?.subheadline || DEFAULT_SUBHEADLINE}
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="relative flex items-center w-full max-w-2xl mx-auto"
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
                            placeholder={isChatDisabled ? "Message limit reached." : "Describe a problem in your business, or ask about my work"}
                            className="w-full h-14 pl-5 pr-16 rounded-xl text-base shadow-sm border-border bg-background focus-visible:ring-1 focus-visible:ring-ring"
                            disabled={inputDisabled}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={inputDisabled || !input.trim()}
                            className="absolute right-2 h-10 w-10 rounded-lg"
                        >
                            <ArrowRight size={18} />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>

                    <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto w-full">
                        {STARTERS.map((s) => (
                            <button
                                key={s.title}
                                type="button"
                                onClick={() => handlePrompt(s.prompt, s.intent)}
                                disabled={inputDisabled}
                                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span className="text-muted-foreground">{s.icon}</span>
                                <span className="font-medium">{s.title}</span>
                            </button>
                        ))}
                    </div>
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
                        <div className="flex flex-col gap-6 pb-2 px-4">
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
                                    <div key={msg.id || i} className={`flex gap-3 w-full min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
                                        {(isBot || isAdmin) && <BotAvatar />}

                                        <div className={`flex flex-col gap-2 w-full min-w-0 ${isUser ? "items-end" : "items-start"}`}>
                                            {cleanContent && (
                                                <div
                                                    className={cn(
                                                        "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap [word-break:break-word] min-w-0 max-w-[85%]",
                                                        isUser && "bg-primary text-primary-foreground rounded-br-sm",
                                                        isAdmin && "bg-muted text-foreground border-l-2 border-primary rounded-bl-sm",
                                                        isBot && "bg-muted/60 text-foreground rounded-bl-sm"
                                                    )}
                                                >
                                                    {isAdmin && <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fil (live)</span>}
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
                                                    {!msg.component && showServices && <Block><ServicesSection /></Block>}
                                                    {!msg.component && showProjects && <Block><ProjectsSection category={projectCategory} /></Block>}
                                                    {!msg.component && showSkills && <Block><SkillsSection highlightSkill={highlightSkill} highlightCategory={highlightCategory} /></Block>}
                                                    {!msg.component && showExperiences && <Block><ExperiencesSection category={experienceCategory} scrollContainer={scrollContainerRef} /></Block>}
                                                    {!msg.component && showAbout && <Block className="overflow-visible py-4 border-0"><AboutSection /></Block>}
                                                    {!msg.component && showContact && <Block className="border-0"><ContactCta /></Block>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex gap-3 items-end" role="status" aria-label="Fil is typing">
                                    <BotAvatar />
                                    <div className="bg-muted/60 rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1 items-center">
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
                <div className="pt-3 pb-6 shrink-0 px-4">
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
                                            className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
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
                            placeholder={isChatDisabled ? "Message limit reached." : "Ask a follow-up or describe your problem"}
                            className="w-full h-12 pl-5 pr-16 rounded-xl shadow-sm border-border bg-background focus-visible:ring-1 focus-visible:ring-ring text-base"
                            disabled={inputDisabled}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={inputDisabled || !input.trim()}
                            className="absolute right-2 h-9 w-9 rounded-lg"
                        >
                            <ArrowRight size={18} />
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
