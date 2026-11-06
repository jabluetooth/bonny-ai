import { PortfolioNavbar } from "@/components/portfolio-navbar";
import { SiteFooter } from "@/components/portfolio-footer";
import { SidebarProvider } from "@/components/ui/sidebar";

export function PortfolioPageShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
            <div className="min-h-[100dvh] flex flex-col bg-app w-full">
                <PortfolioNavbar />
                <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-10 md:pt-16 md:pb-12">
                    {children}
                </main>
                <SiteFooter />
            </div>
        </SidebarProvider>
    );
}
