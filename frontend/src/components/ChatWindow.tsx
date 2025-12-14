import { useChatStore } from "../store/useChatStore";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
    const { messages, clearChat } = useChatStore();

    return (
        <div className="flex flex-col h-screen w-full mx-auto bg-base-100">
            {/* Header */}
            <div className="navbar bg-base-200 px-4">
                <div className="flex-1 text-lg font-semibold">AI Chat</div>
                <button className="btn btn-sm btn-outline" onClick={clearChat}>
                    Clear
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && (
                    <div className="text-center text-base-content/50">
                        Start chatting with AI ✨ Please select a repository
                    </div>
                )}
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
            </div>

            {/* Input */}
            <ChatInput />
        </div>
    );
}
