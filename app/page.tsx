import { PortfolioNavbar } from "@/components/portfolio-navbar";
import { SiteFooter } from "@/components/portoflio-footer";
import { Chatbox } from "@/components/chatbox";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <main className="h-[100dvh] overflow-hidden flex flex-col bg-background w-full">
        <PortfolioNavbar />
        <div className="flex-1 flex flex-col items-center justify-end p-4 md:p-8 pb-12 gap-8 min-h-0 w-full">
          <Chatbox />
        </div>
        <SiteFooter />
      </main>
    </SidebarProvider>
  );
}
