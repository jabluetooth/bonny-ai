"use client";

import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Github, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AboutSection() {
    return (
        <CardContainer className="inter-var">
            <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[40rem] h-auto rounded-xl p-6 border flex flex-col sm:flex-row gap-6 items-center">

                {/* Left Column: Text Content */}
                <div className="flex-1">
                    <CardItem
                        translateZ="50"
                        className="text-4xl font-bold text-neutral-800 dark:text-white mb-2"
                    >
                        I'm Fil, a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
                            creative engineer
                        </span>
                    </CardItem>

                    <div className="space-y-4 my-4">
                        <CardItem
                            as="p"
                            translateZ="60"
                            className="text-neutral-500 dark:text-neutral-300 text-sm leading-relaxed"
                        >
                            I'm Fil Heinz, a proactive full-stack developer passionate about creating dynamic web experiences. From frontend to backend, I thrive on solving complex problems with clean, efficient code.
                        </CardItem>

                        <CardItem
                            as="p"
                            translateZ="50"
                            className="text-neutral-400 text-sm leading-relaxed"
                        >
                            My expertise spans React, Next.js, and Node.js, and I'm always eager to learn more.
                        </CardItem>

                        <CardItem
                            as="p"
                            translateZ="40"
                            className="text-neutral-400 text-xs italic"
                        >
                            "I believe in waking up each day eager to make a difference!"
                        </CardItem>
                    </div>

                    {/* Social Icons */}
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
                        <Link href="#" className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                            <CardItem translateZ={20}>
                                <Twitter size={20} />
                            </CardItem>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Image/Logo Holder */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0">
                    <CardItem
                        translateZ="80"
                        rotateX={10}
                        rotateY={-10}
                        className="w-full h-full rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg"
                    >
                        {/* Temporary Logo / Image Placeholder */}
                        <span className="text-4xl font-bold text-white">FH</span>
                    </CardItem>
                </div>

            </CardBody>
        </CardContainer>
    );
}
