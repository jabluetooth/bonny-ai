import { ChatProvider } from "@/components/chat-provider";

export default function PortfolioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ChatProvider>{children}</ChatProvider>;
}
