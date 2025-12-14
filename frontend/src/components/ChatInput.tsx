import { useState } from "react";
import { useChatStore } from "../store/useChatStore";

export default function ChatInput() {
    const [input, setInput] = useState("");
    const {
        addUserMessage,
        setAILoading,
        isSending,
        currentRepo,
        addAIMessage,
    } = useChatStore();

    const sendMessage = async () => {
        if (!input.trim()) return;

        addUserMessage(input);
        setAILoading();
        addAIMessage(input);
        setInput("");
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
