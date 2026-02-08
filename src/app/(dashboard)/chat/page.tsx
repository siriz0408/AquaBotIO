import { ChatContainer } from "@/components/chat/chat-container";

export const metadata = {
  title: "Chat - AquaBotAI",
  description: "Chat with your AI aquarium assistant",
};

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-5rem)]">
      <ChatContainer showTankSwitcher />
    </div>
  );
}
