"use client";

import { supabase } from "@/lib/supabase-client"
import { Status, StatusLabel } from "@/components/ui/shadcn-io/status"
import { VisitorCounter } from './visitor-counter';
import { useChat } from "@/components/chat-provider"
import { Github, Linkedin, Instagram, Globe } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from 'react';

const SOCIAL_LINKS = [
    { label: "GitHub", href: "https://github.com/jabluetooth", Icon: Github },
    { label: "LinkedIn", href: "https://ph.linkedin.com/in/filheinzrelatorre", Icon: Linkedin },
    { label: "Instagram", href: "https://www.instagram.com/fil.tower", Icon: Instagram },
    { label: "Portfolio", href: "https://www.filheinzrelatorre.com/", Icon: Globe },
]

const EXPLORE_LINKS = [
    { label: "About", query: "Tell me about yourself." },
    { label: "Projects", query: "Show me your projects." },
    { label: "Skills", query: "What are your skills?" },
    { label: "Experiences", query: "Tell me about your work history and education." },
]

/**
 * Same shape/format as Insight's footer: two panels, rounded on the top
 * corners only, no bottom radius/padding so they run flush to the page's
 * bottom edge instead of floating as closed rectangles. Content is adapted
 * to this site's own format (chat-driven, not real routes) and keeps the
 * live visitor count / availability status this footer already had.
 */
export function SiteFooter() {
    const [status, setStatus] = useState<string>("available_fulltime")
    const { startChat, conversationId, sendMessage } = useChat()

    useEffect(() => {
        async function fetchStatus() {
            const { data } = await supabase
                .from('author_profiles')
                .select('status')
                .eq('is_active', true)
                .maybeSingle()

            if (data?.status) {
                setStatus(data.status)
            }
        }
        fetchStatus()
    }, [])

    const getStatusConfig = (s: string) => {
        switch (s) {
            case 'available_fulltime': return { text: "Available for Full-time", color: "bg-emerald-500" }
            case 'available_parttime': return { text: "Open for Part-time", color: "bg-yellow-500" }
            case 'open_for_discussion': return { text: "Open for Discussion", color: "bg-blue-500" }
            case 'busy': return { text: "Busy / Not Looking", color: "bg-red-500" }
            default: return { text: "Available", color: "bg-emerald-500" }
        }
    }

    const config = getStatusConfig(status)
    const year = new Date().getFullYear()

    const handleExploreClick = async (query: string) => {
        let activeId = conversationId
        if (!activeId) {
            const newId = await startChat("Guest")
            if (newId) activeId = newId
        }
        if (activeId) {
            sendMessage(query, undefined, activeId)
        }
    }

    return (
        <footer className="w-full mt-auto">
            <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-wrap items-stretch justify-between gap-4">
                {/* Brand panel */}
                <div className="flex-1 min-w-[240px] flex flex-col justify-between gap-6 rounded-t-2xl bg-primary text-primary-foreground px-6 pt-6 pb-5">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/bot-avatar.png"
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full object-cover"
                        />
                        <span className="text-xl font-bold tracking-tight">Bonny-Ai</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium opacity-80 max-w-[34ch]">
                            Skip the scrolling. Just ask Bonny.
                        </p>

                        <div className="flex items-center gap-1">
                            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                                <a
                                    key={href}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="inline-flex items-center justify-center h-9 w-9 opacity-75 hover:opacity-100 transition-opacity"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <VisitorCounter initialCount={0} />
                            <Status status="online" className="px-2 py-0.5 h-7 text-xs">
                                <span className="relative flex h-2 w-2">
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.color}`}></span>
                                    <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`}></span>
                                </span>
                                <StatusLabel className="text-xs">{config.text}</StatusLabel>
                            </Status>
                        </div>

                        <p className="text-xs opacity-65">&copy; {year} Bonny AI by Fil Heinz Re La Torre</p>
                    </div>
                </div>

                {/* Links panel */}
                <nav aria-label="Footer" className="flex-none w-full sm:w-[200px] rounded-t-2xl border border-border bg-card px-6 pt-6 pb-5">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                        Explore
                    </h2>
                    <ul className="flex flex-col gap-2">
                        {EXPLORE_LINKS.map((item) => (
                            <li key={item.label}>
                                <button
                                    type="button"
                                    onClick={() => handleExploreClick(item.query)}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </footer>
    )
}
