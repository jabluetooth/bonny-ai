"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/components/chat-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, ArrowRight } from "lucide-react";
import { WelcomeModal } from "./welcome-modal";

export function Chatbox() {
    const { conversationId, sendMessage, messages, isLoading, userName, welcomePlaceholder, isWelcomeOpen } = useChat();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
        if (!input.trim()) return;
        await sendMessage(input);
        setInput("");
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
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
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isWelcomeOpen ? welcomePlaceholder : "Ask me anything..."}
                            className="w-full h-14 pl-6 pr-16 rounded-full text-lg shadow-lg border-muted-foreground/20 bg-background focus-visible:ring-1 focus-visible:ring-primary/50 transition-all hover:shadow-xl"
                            disabled={!conversationId || isLoading}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!conversationId || isLoading || !input.trim()}
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
            <div className="w-full max-w-3xl flex flex-col h-[calc(100vh-180px)] animate-in fade-in zoom-in-95 duration-500">
                {/* Messages Area - Flexible & Transparent */}
                <div className="flex-1 overflow-hidden relative mb-4">
                    <ScrollArea ref={scrollRef} className="h-full pr-4">
                        <div className="flex flex-col flex-1 justify-end gap-4 pb-2">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "items-end"
                                        }`}
                                >
                                    {/* Bot Avatar (Only for bot) */}
                                    {msg.role === "bot" && (
                                        <Avatar className="h-8 w-8 shrink-0 border border-border/30 shadow-sm">
                                            <AvatarImage src="/bot-avatar.png" />
                                            <AvatarFallback className="bg-primary/10 text-primary"><Bot size={14} /></AvatarFallback>
                                        </Avatar>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={`rounded-[20px] px-5 py-2.5 text-[15px] shadow-sm leading-relaxed ${msg.role === "user"
                                            ? "bg-[#0084ff] text-white rounded-br-none" // Messenger Blue
                                            : "bg-muted text-foreground rounded-bl-none" // Messenger Gray
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
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
                        className="relative flex items-center w-full"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full h-12 pl-5 pr-14 rounded-full shadow-md border-border/40 bg-background/80 backdrop-blur-md focus-visible:ring-1 focus-visible:ring-primary/30 transition-shadow hover:shadow-lg"
                            disabled={!conversationId || isLoading}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!conversationId || isLoading || !input.trim()}
                            className="absolute right-1.5 h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                        >
                            <ArrowRight size={18} />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}
