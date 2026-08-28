import { PortfolioNavbar } from "@/components/portfolio-navbar";
import { SiteFooter } from "@/components/portfolio-footer";
import { SidebarProvider } from "@/components/ui/sidebar";

export function PortfolioPageShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
            <div className="min-h-[100dvh] flex flex-col bg-background w-full">
                <PortfolioNavbar />
                <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
                    {children}
                </main>
                <SiteFooter />
            </div>
        </SidebarProvider>
    );
}
