import { create } from "zustand";

export type Role = "user" | "ai";

export interface ChatMessage {
    id: string;
    role: Role;
    content: string;
    isLoading?: boolean;
}

interface ChatState {
    messages: ChatMessage[];
    isSending: boolean;
    currentRepo: string | null;
    setCurrentRepo: (repoId: string) => void;
    addUserMessage: (content: string) => void;
    addAIMessage: (content: string) => void;
    setAILoading: () => void;
    replaceLastAIMessage: (content: string) => void;
    clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isSending: false,
    currentRepo: null,
    messages: [],
    setCurrentRepo: (repoId) => {
        set({ currentRepo: repoId });
    },
    addUserMessage: (content) =>
        set((state) => ({
            messages: [
                ...state.messages,
                { id: crypto.randomUUID(), role: "user", content },
            ],
            isSending: true,
        })),
    setAILoading: () =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    id: crypto.randomUUID(),
                    role: "ai",
                    content: "Thinking...",
                    isLoading: true,
                },
            ],
        })),
    replaceLastAIMessage: (content) =>
        set((state) => ({
            messages: state.messages.map((m, i) =>
                i === state.messages.length - 1
                    ? { ...m, content, isLoading: false }
                    : m
            ),
            isSending: false,
        })),

    addAIMessage: (content) =>
        set((state) => ({
            messages: [
                ...state.messages,
                { id: crypto.randomUUID(), role: "ai", content },
            ],
            isSending: false,
        })),

    clearChat: () => set({ messages: [], isSending: false }),
}));
