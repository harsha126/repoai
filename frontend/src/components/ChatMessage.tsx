import type { ChatMessage as Message } from "../store/useChatStore";

export default function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <div className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
            <div className="chat-header">{isUser ? "You" : "AI"}</div>

            <div
                className={`chat-bubble ${
                    isUser ? "chat-bubble-primary" : "chat-bubble-secondary"
                }`}
            >
                {message.isLoading && (
                    <span className="loading loading-dots loading-sm"></span>
                )}
                {!message.isLoading && message.content}
            </div>
        </div>
    );
}
