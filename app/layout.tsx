import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/components/chat-provider";
import { Toaster } from "@/components/ui/sonner";
import FluidCursor from "@/components/ui/fluid-cursor";

import { DisableDevTools } from "@/components/security/disable-devtools";

const inter = Inter({
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <DisableDevTools />
        <ChatProvider>
          <FluidCursor />
          {children}
          <Toaster />
        </ChatProvider>
      </body>
    </html>
  );
}
