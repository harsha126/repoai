import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
interface RepoState {
    ingestingRepo: boolean;
    ingestRepo: (repoUrl: string) => Promise<void>;
}

export const useRepoStore = create<RepoState>((set) => ({
    ingestingRepo: false,
    ingestRepo: async (repoUrl: string) => {
        set({ ingestingRepo: true });
        try {
            const res = await axiosInstance.post("/repo/ingest", {
                repoUrl,
            });
            toast.success("Ingestion started Sucessfully");
        } catch (err) {
            console.log("Error while ingesting repo url ", err);
            toast.error("Error While ingesting repo");
        } finally {
            set({ ingestingRepo: false });
        }
    },
}));
