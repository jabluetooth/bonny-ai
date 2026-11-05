"use client";

import { supabase } from "@/lib/supabase-client"
import { Status, StatusLabel } from "@/components/ui/shadcn-io/status"
import { VisitorCounter } from './visitor-counter';
import { Github, Linkedin, Instagram } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from 'react';

const SOCIAL_LINKS = [
    { label: "GitHub", href: "https://github.com/jabluetooth", Icon: Github },
    { label: "LinkedIn", href: "https://ph.linkedin.com/in/filheinzrelatorre", Icon: Linkedin },
    { label: "Instagram", href: "https://www.instagram.com/fil.tower", Icon: Instagram },
]

const EXPLORE_LINKS = [
    { label: "Services", href: "/services" },
    { label: "Case Studies", href: "/projects" },
    { label: "About", href: "/about" },
    { label: "Skills", href: "/skills" },
    { label: "Experiences", href: "/experiences" },
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
            case 'available_fulltime': return { text: "Available for new projects", color: "bg-emerald-500" }
            case 'available_parttime': return { text: "Available for project work", color: "bg-yellow-500" }
            case 'open_for_discussion': return { text: "Open to conversations", color: "bg-blue-500" }
            case 'busy': return { text: "Fully booked", color: "bg-red-500" }
            default: return { text: "Available", color: "bg-emerald-500" }
        }
    }

    const config = getStatusConfig(status)
    const year = new Date().getFullYear()

    return (
        <footer className="w-full mt-auto">
            {/* One compact block: brand + links + socials/status. Wraps to two
                short rows on phones instead of two tall stacked panels. */}
            <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4">
                <div className="rounded-t-2xl bg-primary text-primary-foreground px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Image
                            src="/bot-avatar.png"
                            alt=""
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-full object-cover"
                        />
                        <span className="font-bold tracking-tight">Bonny-AI</span>
                        <span className="text-xs opacity-65 truncate">&copy; {year} Fil Heinz Re La Torre</span>
                    </div>

                    <nav aria-label="Footer">
                        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {EXPLORE_LINKS.map((item) => (
                                <li key={item.label}>
                                    <Link
                                        href={item.href}
                                        className="text-xs sm:text-sm opacity-75 hover:opacity-100 transition-opacity"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex items-center gap-2">
                        <Status status="online" className="px-2 py-0.5 h-7 text-xs">
                            <span className="relative flex h-2 w-2">
                                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.color}`}></span>
                                <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`}></span>
                            </span>
                            <StatusLabel className="text-xs text-secondary-foreground">{config.text}</StatusLabel>
                        </Status>
                        <VisitorCounter initialCount={0} />
                        <div className="flex items-center">
                            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                                <a
                                    key={href}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="inline-flex items-center justify-center h-8 w-8 opacity-75 hover:opacity-100 transition-opacity"
                                >
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
