"use client";

import React, { useEffect, useState } from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Github, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Skeleton } from "@/components/ui/skeleton";
import TiltedCard from "@/components/ui/tilted-card";

interface AuthorProfile {
    title: string;
    description: string;
    images: string[];
}

export function AboutSection() {
    const [profile, setProfile] = useState<AuthorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!profile?.images || profile.images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % profile.images.length);
        }, 5000); // 2 seconds per image

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
                        <CardItem translateZ="50" className="text-4xl font-bold text-neutral-800 dark:text-white mb-2">
                            I'm Fil, a <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
                                creative engineer
                            </span>
                        </CardItem>
                        <div className="space-y-4 my-4">
                            <CardItem as="p" translateZ="60" className="text-neutral-500 dark:text-neutral-300 text-sm leading-relaxed">
                                I'm Fil Heinz, a proactive full-stack developer passionate about creating dynamic web experiences. From frontend to backend, I thrive on solving complex problems with clean, efficient code.
                            </CardItem>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <Link href="#" className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><CardItem translateZ={20}><Linkedin size={20} /></CardItem></Link>
                            <Link href="#" className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><CardItem translateZ={20}><Github size={20} /></CardItem></Link>
                            <Link href="#" className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><CardItem translateZ={20}><Twitter size={20} /></CardItem></Link>
                        </div>
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
                        className="text-4xl font-bold text-neutral-800 dark:text-white mb-2"
                    >
                        {/* Fallback to 'Author' if title missing in specific generic profile rows */}
                        {profile.title || "Author"}
                    </CardItem>

                    <div className="space-y-4 my-4">
                        <CardItem
                            as="p"
                            translateZ="60"
                            className="text-neutral-500 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap"
                        >
                            {profile.description}
                        </CardItem>
                    </div>

                    {/* TODO: Add Social Links to DB schema if needed. Using static placeholders for now. */}
                    <div className="flex gap-4 mt-6">
                        <Link href="#" className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                            <CardItem translateZ={20}>
                                <Linkedin size={20} />
                            </CardItem>
                        </Link>
                        <Link href="#" className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                            <CardItem translateZ={20}>
                                <Github size={20} />
                            </CardItem>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Image */}
                {profile.images && profile.images.length > 0 && (
                    <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0">
                        <TiltedCard
                            imageSrc={
                                <img
                                    src={profile.images[currentImageIndex]}
                                    alt="Profile"
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
