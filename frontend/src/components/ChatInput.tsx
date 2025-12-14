import { useState } from "react";
import { useChatStore } from "../store/useChatStore";

export default function ChatInput() {
    const [input, setInput] = useState("");
    const {
        addUserMessage,
        setAILoading,
        replaceLastAIMessage,
        isSending,
        currentRepo,
    } = useChatStore();

    const sendMessage = async () => {
        if (!input.trim()) return;

        addUserMessage(input);
        setInput("");
        setAILoading();

        setTimeout(() => {
            replaceLastAIMessage(
                "This is a mock AI response. Connect your backend here 🤖"
            );
        }, 1200);
    };

    return (
        <div className="flex gap-2 p-4 border-t border-base-300">
            <input
                className="input input-bordered w-full"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isSending || !currentRepo}
            />
            <button
                className="btn btn-primary"
                onClick={sendMessage}
                disabled={isSending || !currentRepo}
            >
                Send
            </button>
        </div>
    );
}
