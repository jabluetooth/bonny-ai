import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/components/motion-provider";

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
    { media: "(prefers-color-scheme: light)", color: "#e7ebf3" },
    { media: "(prefers-color-scheme: dark)", color: "#e7ebf3" },
  ],
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Fil Heinz O. Re La Torre",
    url: siteUrl,
    image: `${siteUrl}/bot-avatar.png`,
    jobTitle: "Automation & AI Solutions Engineer",
    description: "Automation & AI Solutions Engineer helping businesses cut manual work and grow",
    sameAs: [
      "https://github.com/jabluetooth",
      "https://ph.linkedin.com/in/filheinzrelatorre",
      "https://www.instagram.com/fil.tower",
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
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fil Heinz Portfolio",
    url: siteUrl,
    description: "Fil Heinz O. Re La Torre, Automation & AI Solutions Engineer. I help businesses cut manual work and grow with automation, AI and custom software. Ask about a problem and see the case studies.",
  },
];

export const metadata: Metadata = {
  title: {
    default: "Fil Heinz | Talk to My Portfolio",
    template: "%s | Fil Heinz",
  },
  description: "Fil Heinz O. Re La Torre, Automation & AI Solutions Engineer. I help businesses cut manual work and grow with automation, AI and custom software. Ask about a problem and see the case studies.",
  keywords: ["Software Engineer", "Web Developer", "AI", "Machine Learning", "React", "Next.js", "Portfolio", "Fil Heinz", "Full Stack Developer"],
  authors: [{ name: "Fil Heinz O. Re La Torre" }],
  creator: "Fil Heinz O. Re La Torre",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Fil Heinz | Automation & AI Solutions",
    description: "Describe a problem in your business and get a straight answer, with case studies showing the problem, the solution and the results.",
    siteName: "Fil Heinz Portfolio",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Fil Heinz - Software Engineer Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fil Heinz | Automation & AI Solutions",
    description: "Describe a problem in your business and get a straight answer, with case studies showing the problem, the solution and the results.",
    images: [`${siteUrl}/og-image.png`],
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
  // Icons come from app/icon.png (48px) and app/apple-icon.png (180px).
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <MotionProvider>{children}</MotionProvider>
        <Toaster />
      </body>
    </html>
  );
}
