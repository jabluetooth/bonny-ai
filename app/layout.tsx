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

export const metadata: Metadata = {
  title: {
    default: "Fil Heinz - Software Engineer Portfolio",
    template: "%s | Fil Heinz",
  },
  description: "AI-powered interactive portfolio of Fil Heinz O. Re La Torre, a passionate Software Engineer specializing in web development, AI/ML, and modern technologies.",
  keywords: ["Software Engineer", "Web Developer", "AI", "Machine Learning", "React", "Next.js", "Portfolio"],
  authors: [{ name: "Fil Heinz O. Re La Torre" }],
  creator: "Fil Heinz O. Re La Torre",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Fil Heinz - Software Engineer Portfolio",
    description: "AI-powered interactive portfolio showcasing projects, skills, and experience.",
    siteName: "Fil Heinz Portfolio",
    images: [
      {
        url: "/avatar.png",
        width: 512,
        height: 512,
        alt: "Fil Heinz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fil Heinz - Software Engineer Portfolio",
    description: "AI-powered interactive portfolio showcasing projects, skills, and experience.",
    images: ["/avatar.png"],
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
