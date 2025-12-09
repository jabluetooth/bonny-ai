import { PortfolioNavbar } from "@/components/portfolio-navbar";
import { SiteFooter } from "@/components/portoflio-footer";
import { Chatbox } from "@/components/chatbox";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <PortfolioNavbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 gap-8">
        <Chatbox />
      </div>
      <SiteFooter />
    </main>
  );
}
