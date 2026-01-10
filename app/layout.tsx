import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/components/chat-provider";
import { Toaster } from "@/components/ui/sonner";
import FluidCursor from "@/components/ui/fluid-cursor";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://filheinzrelatorre.com";

export const metadata: Metadata = {
  title: {
    default: "Fil Heinz - Software Engineer Portfolio",
    template: "%s | Fil Heinz",
  },
  description: "Check out my portfolio website! AI-powered interactive portfolio of Fil Heinz O. Re La Torre - Software Engineer specializing in web development and AI/ML.",
  keywords: ["Software Engineer", "Web Developer", "AI", "Machine Learning", "React", "Next.js", "Portfolio", "Fil Heinz", "Full Stack Developer"],
  authors: [{ name: "Fil Heinz O. Re La Torre" }],
  creator: "Fil Heinz O. Re La Torre",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Fil Heinz - Software Engineer Portfolio",
    description: "Check out my portfolio website! AI-powered interactive portfolio showcasing projects, skills, and experience.",
    siteName: "Fil Heinz Portfolio",
    images: [
      {
        url: `${siteUrl}/avatar.png`,
        width: 512,
        height: 512,
        alt: "Fil Heinz - Software Engineer",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Fil Heinz - Software Engineer Portfolio",
    description: "Check out my portfolio website! AI-powered interactive portfolio showcasing projects, skills, and experience.",
    images: [`${siteUrl}/avatar.png`],
    creator: "@filheinz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/avatar.png",
    shortcut: "/avatar.png",
    apple: "/avatar.png",
  },
  verification: {
    // Add your Google Search Console verification code here after setup
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ChatProvider>
          <FluidCursor />
          {children}
          <Toaster />
        </ChatProvider>
      </body>
    </html>
  );
}
