import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.filheinzrelatorre.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Fil Heinz O. Re La Torre",
  url: siteUrl,
  image: `${siteUrl}/avatar.png`,
  jobTitle: "Software Engineer",
  description: "Software Engineer specializing in web development and AI/ML",
  sameAs: [
    "https://github.com/filheinzrelatorre",
    "https://linkedin.com/in/filheinzrelatorre",
  ],
  knowsAbout: [
    "Software Engineering",
    "Web Development",
    "React",
    "Next.js",
    "TypeScript",
    "AI/Machine Learning",
    "Full Stack Development",
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Fil Heinz",
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
        width: 1200,
        height: 630,
        alt: "Fil Heinz - Software Engineer Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
