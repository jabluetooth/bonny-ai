import { PortfolioNavbar } from "@/components/portfolio-navbar";
import { SiteFooter } from "@/components/portfolio-footer";
import { Chatbox } from "@/components/chatbox";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <main className="min-h-[100dvh] flex flex-col bg-background w-full">
        <PortfolioNavbar />
        {/* Bounded height instead of open-ended flex-1: caps the chat area
            so a long conversation scrolls internally (see chatbox.tsx)
            instead of growing this wrapper — and with it the whole page —
            taller. min-h-0 lets it still shrink on short/mobile viewports;
            max-h caps how tall it gets on very tall ones. The footer below
            keeps reaching the bottom of the viewport via its own mt-auto
            regardless of how tall this ends up. */}
        <div className="flex-1 min-h-0 max-h-[46rem] flex flex-col items-center justify-end p-4 md:p-8 pb-12 gap-8 w-full">
          <Chatbox />
        </div>
        <SiteFooter />
      </main>
    </SidebarProvider>
  );
}
