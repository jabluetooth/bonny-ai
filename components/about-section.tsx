"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Github, Linkedin, Instagram } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Skeleton } from "@/components/ui/skeleton";
import TiltedCard from "@/components/ui/tilted-card";

const SOCIALS = [
    { label: "LinkedIn", href: "https://ph.linkedin.com/in/filheinzrelatorre", Icon: Linkedin },
    { label: "GitHub", href: "https://github.com/jabluetooth", Icon: Github },
    { label: "Instagram", href: "https://www.instagram.com/fil.tower", Icon: Instagram },
];

function SocialRow() {
    return (
        <div className="flex gap-4 mt-6">
            {SOCIALS.map(({ label, href, Icon }) => (
                <Link key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-muted-foreground hover:text-foreground transition-colors">
                    <CardItem translateZ={20}>
                        <Icon size={20} />
                    </CardItem>
                </Link>
            ))}
        </div>
    );
}

interface AuthorProfile {
    title: string;
    description: string;
    images: string[];
}

export function AboutSection() {
    const [profile, setProfile] = useState<AuthorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (!profile?.images || profile.images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % profile.images.length);
        }, 5000); // 5 seconds per image

        return () => clearInterval(interval);
    }, [profile?.images]);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data } = await supabase
                    .from('author_profiles')
                    .select('*')
                    .eq('is_active', true)
                    .maybeSingle();

                if (data) {
                    setProfile(data);
                }
            } catch (err) {
                console.error("Error fetching author profile:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="w-full sm:w-[40rem] h-64 p-6 rounded-xl border bg-muted/20 animate-pulse flex flex-col gap-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        );
    }

    // Default Fallback (Fil Heinz) if DB is empty
    if (!profile) {
        return (
            <CardContainer className="inter-var">
                <CardBody className="relative group/card w-auto sm:w-[40rem] h-auto p-6 flex flex-col sm:flex-row gap-6 items-center">
                    <div className="flex-1">
                        <CardItem translateZ="50" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
                            I&apos;m Fil, an <br />
                            <span className="text-brand">
                                AI &amp; automation engineer
                            </span>
                        </CardItem>
                        <div className="space-y-4 my-4">
                            <CardItem as="p" translateZ="60" className="type-body max-w-[65ch] text-muted-foreground">
                                I build automation, AI systems and full-stack products that take repetitive work off a team and turn it into measurable time and cost savings.
                            </CardItem>
                        </div>
                        <SocialRow />
                    </div>
                </CardBody>
            </CardContainer>
        );
    }

    return (
        <CardContainer className="inter-var">
            <CardBody className="relative group/card w-auto sm:w-[40rem] h-auto p-6 flex flex-col sm:flex-row gap-6 items-center">

                {/* Dynamic Content */}
                <div className="flex-1">
                    <CardItem
                        translateZ="50"
                        className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2"
                    >
                        {/* Fallback to 'Author' if title missing in specific generic profile rows */}
                        {profile.title || "Author"}
                    </CardItem>

                    <div className="space-y-4 my-4">
                        <CardItem
                            as="p"
                            translateZ="60"
                            className="type-body max-w-[65ch] text-muted-foreground whitespace-pre-wrap"
                        >
                            {profile.description}
                        </CardItem>
                    </div>
                    <SocialRow />
                </div>

                {/* Right Column: Image */}
                {profile.images && profile.images.length > 0 && (
                    <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0">
                        <TiltedCard
                            imageSrc={
                                <Image
                                    src={profile.images[currentImageIndex]}
                                    alt="Profile"
                                    width={160}
                                    height={160}
                                    className="w-full h-full object-cover transition-opacity duration-500 rounded-xl"
                                    key={currentImageIndex}
                                />
                            }
                            altText="Profile"
                            captionText={profile.title || "Author"}
                            containerHeight="100%"
                            containerWidth="100%"
                            imageHeight="100%"
                            imageWidth="100%"
                            rotateAmplitude={14}
                            scaleOnHover={1.15}
                            showMobileWarning={false}
                            showTooltip={true}
                            displayOverlayContent={false}
                        />
                    </div>
                )}
            </CardBody>
        </CardContainer>
    );
}
