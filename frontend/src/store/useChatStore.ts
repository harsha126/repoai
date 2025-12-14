import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export type Role = "user" | "ai";

export interface ChatMessage {
    id: string;
    role: Role;
    content: string;
    isLoading?: boolean;
}

export interface ChatState {
    chats: Record<string, ChatMessage[]>;
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

export const useChatStore = create<ChatState>((set, get) => ({
    chats: {},
    isSending: false,
    currentRepo: null,
    messages: [],

    setCurrentRepo: (repoId) => {
        const { chats } = get();
        set({
            currentRepo: repoId,
            messages: chats[repoId] || [],
        });
    },

    addUserMessage: async (content) => {
        const { currentRepo, chats } = get();
        if (!currentRepo) return;

        set({ isSending: true });
        try {
            const newMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content,
            };
            const updatedRepoChats = [
                ...(chats[currentRepo] || []),
                newMessage,
            ];

            set({
                chats: { ...chats, [currentRepo]: updatedRepoChats },
                messages: updatedRepoChats,
            });
        } catch (err) {
            toast.error("Error while sending message");
        } finally {
            set({ isSending: false });
        }
    },

    setAILoading: () => {
        const { currentRepo, chats } = get();
        if (!currentRepo) return;

        const loadingMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "ai",
            content: "Thinking...",
            isLoading: true,
        };
        const updatedRepoChats = [
            ...(chats[currentRepo] || []),
            loadingMessage,
        ];

        set({
            chats: { ...chats, [currentRepo]: updatedRepoChats },
            messages: updatedRepoChats,
        });
    },

    replaceLastAIMessage: (content) => {
        const { currentRepo, chats } = get();
        if (!currentRepo) return;

        const currentChats = chats[currentRepo] || [];
        const updatedRepoChats = currentChats.map((m, i) =>
            i === currentChats.length - 1
                ? { ...m, content, isLoading: false }
                : m
        );

        set({
            chats: { ...chats, [currentRepo]: updatedRepoChats },
            messages: updatedRepoChats,
            isSending: false,
        });
    },

    addAIMessage: async (content) => {
        const { currentRepo, chats } = get();
        if (!currentRepo) return;
        const history = chats[currentRepo] || [];
        const chatHistoryForBackend = [];
        for (let i = 0; i < history.length - 1; i += 2) {
            if (history[i].role === "user" && history[i + 1]?.role === "ai") {
                chatHistoryForBackend.push({
                    question: history[i].content,
                    answer: history[i + 1].content,
                });
            }
        }

        const res = await axiosInstance.post("/chat/message/" + currentRepo, {
            currentMessage: content,
            chatHistory: chatHistoryForBackend,
        });

        const { answer } = res.data;

        get().replaceLastAIMessage(answer);
    },

    clearChat: () => {
        const { currentRepo, chats } = get();
        if (!currentRepo) return;

        set({
            chats: { ...chats, [currentRepo]: [] },
            messages: [],
            isSending: false,
        });
    },
}));
