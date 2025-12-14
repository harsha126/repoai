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

export const useChatStore = create<ChatState>((set, get) => ({
    isSending: false,
    currentRepo: null,
    messages: [],
    setCurrentRepo: (repoId) => {
        set({ currentRepo: repoId });
    },
    addUserMessage: async (content) => {
        set({ isSending: true });
        try {
            set((state) => ({
                messages: [
                    ...state.messages,
                    { id: crypto.randomUUID(), role: "user", content },
                ],
            }));
        } catch (err) {
            toast.error("error while sending message " + "");
        } finally {
            set({ isSending: false });
        }
    },
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

    addAIMessage: async (content) => {
        const currentRepo = get().currentRepo;
        const res = await axiosInstance.post("/chat/message/" + currentRepo, {
            currentMessage: content,
            chatHistory: [],
        });

        const { answer } = res.data;

        get().replaceLastAIMessage(answer);
        // set((state) => ({
        //     messages: [
        //         ...state.messages,
        //         { id: crypto.randomUUID(), role: "ai", content: answer },
        //     ],
        //     isSending: false,
        // }));
    },

    clearChat: () => set({ messages: [], isSending: false }),
}));
