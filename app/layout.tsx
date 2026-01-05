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
  title: "Bonny AI - Smart Portfolio",
  description: "A database-driven AI portfolio application.",
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
