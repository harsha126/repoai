import type { ChatMessage as Message } from "../store/useChatStore";
import MarkdownRenderer from "./MarkDownRenderer";

export default function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <div className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
            <div className="chat-header">{isUser ? "You" : "AI"}</div>

            <div
                className={`chat-bubble ${
                    isUser ? "chat-bubble-neutral" : "bg-base-300"
                }`}
            >
                {message.isLoading && (
                    <span className="loading loading-dots loading-sm"></span>
                )}
                {!message.isLoading && (
                    <MarkdownRenderer answer={message.content} />
                )}
            </div>
        </div>
    );
}
