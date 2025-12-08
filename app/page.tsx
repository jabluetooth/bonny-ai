import { PortfolioNavbar } from "@/components/portfolio-navbar";
import { SiteFooter } from "@/components/portoflio-footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <PortfolioNavbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1>Portfolio & Chatbot Loading...</h1>
      </div>
      <SiteFooter />
    </main>
  );
}
