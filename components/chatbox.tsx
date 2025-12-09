"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/components/chat-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User } from "lucide-react";
import { WelcomeModal } from "./welcome-modal";

export function Chatbox() {
    const { conversationId, sendMessage, messages, isLoading, userName } = useChat();
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
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    return (
        <>
            <WelcomeModal />
            <Card className="w-full max-w-md h-[600px] flex flex-col shadow-xl border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
                <CardHeader className="border-b px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-md">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="/bot-avatar.png" />
                            <AvatarFallback className="bg-primary/20 text-primary"><Bot size={16} /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span>{userName ? `Hi, ${userName}` : 'Bonny AI'}</span>
                            <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-1">
                                {conversationId ? (
                                    <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online</>
                                ) : (
                                    "Connecting..."
                                )}
                            </span>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea ref={scrollRef} className="h-full p-4">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 opacity-50">
                                <Bot className="h-12 w-12 mb-2" />
                                <p className="text-sm">Say hello to start the conversation!</p>
                            </div>
                        )}
                        <div className="flex flex-col gap-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                        }`}
                                >
                                    <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                                        {msg.role === "user" ? (
                                            <>
                                                <AvatarImage src="/user-avatar.png" />
                                                <AvatarFallback className="bg-muted"><User size={14} /></AvatarFallback>
                                            </>
                                        ) : (
                                            <>
                                                <AvatarImage src="/bot-avatar.png" />
                                                <AvatarFallback className="bg-primary/20 text-primary"><Bot size={14} /></AvatarFallback>
                                            </>
                                        )}
                                    </Avatar>
                                    <div
                                        className={`rounded-2xl px-4 py-2 text-sm ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted text-foreground rounded-tl-sm"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 max-w-[85%]">
                                    <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                                        <AvatarFallback className="bg-primary/20 text-primary"><Bot size={14} /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>

                <CardFooter className="p-3 border-t bg-background/50">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex w-full gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-background"
                            disabled={!conversationId || isLoading}
                        />
                        <Button type="submit" size="icon" disabled={!conversationId || isLoading || !input.trim()}>
                            <Send size={18} />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </>
    );
}
