import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import type { JobDTO } from "../components/RepoIngestionList";
import { io, Socket } from "socket.io-client";

interface RepoState {
    ingestingRepo: boolean;
    gettingAllJobs: boolean;
    allJobs: JobDTO[];
    allReadyJobs: JobDTO[];
    socket: Socket | null;
    ingestRepo: (repoUrl: string) => Promise<void>;
    getAllJobs: () => Promise<void>;
    cancelIngestion: (jobId: string) => Promise<void>;
    initializeSocket: () => void;
}

export const useRepoStore = create<RepoState>((set, get) => ({
    ingestingRepo: false,
    gettingAllJobs: false,
    allJobs: [],
    allReadyJobs: [],
    socket: null,

    initializeSocket: () => {
        if (get().socket) return;

        const socket = io("http://localhost:4000");

        socket.on("connect", () => {
            console.log("Connected to websocket");
        });

        socket.on("job-progress", (data: any) => {
            console.log("Job progress:", data);
            const { jobId, type, status, totalTokens } = data;

            set((state) => {
                const updatedJobs = state.allJobs.map((job) => {
                    if (job.jobId === jobId) {
                        const updatedJob = { ...job };
                        if (type === "status") {
                            updatedJob.status = status;
                        } else if (type === "progress") {
                            // updatedJob.progress = progress; // If we add progress field later
                            updatedJob.tokenCount = totalTokens;
                        }
                        // We can add progress/tokens to JobDTO if we want to display it
                        // For now, assuming JobDTO might need extension or we just update status
                        // If we want to show tokens, we need to extend JobDTO
                        return updatedJob;
                    }
                    return job;
                });
                return { allJobs: updatedJobs };
            });

            // Should also refresh jobs if status is completed to update allReadyJobs?
            if (type === "status" && status === "COMPLETED") {
                get().getAllJobs();
            }
        });

        set({ socket });
    },

    ingestRepo: async (repoUrl: string) => {
        set({ ingestingRepo: true });
        try {
            await axiosInstance.post("/repo/ingest", {
                repoUrl,
            });
            toast.success("Ingestion started Sucessfully");
            get().getAllJobs();
        } catch (err) {
            console.log("Error while ingesting repo url ", err);
            toast.error("Error While ingesting repo");
        } finally {
            set({ ingestingRepo: false });
        }
    },

    getAllJobs: async () => {
        set({ gettingAllJobs: true });
        try {
            const res = await axiosInstance.get("/repo/job");
            const allJobs: JobDTO[] = res.data.data;
            set({
                allJobs,
                allReadyJobs: allJobs.filter(
                    (job) => job.status == "COMPLETED"
                ),
            });
            // toast.success(res.data.message ?? "All jobs fetched succesfully");
        } catch (err) {
            console.log("Error while getting all jobs ", err);
            toast.error("Error While getting all jobs");
        } finally {
            set({ gettingAllJobs: false });
        }
    },

    cancelIngestion: async (jobId: string) => {
        try {
            await axiosInstance.post(`/repo/cancel/${jobId}`);
            toast.success("Ingestion cancelled");
            get().getAllJobs();
        } catch (err) {
            console.error("Error cancelling ingestion", err);
            toast.error("Failed to cancel ingestion");
        }
    },
}));
