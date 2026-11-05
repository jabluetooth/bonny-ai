import { ChatProvider } from "@/components/chat-provider";
import FluidCursor from "@/components/ui/fluid-cursor";

export default function PortfolioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ChatProvider>
            <FluidCursor />
            {children}
        </ChatProvider>
    );
}
