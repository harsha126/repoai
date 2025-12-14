import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import type { JobDTO } from "../components/RepoIngestionList";
interface RepoState {
    ingestingRepo: boolean;
    gettingAllJobs: boolean;
    allJobs: JobDTO[];
    allReadyJobs: JobDTO[];
    ingestRepo: (repoUrl: string) => Promise<void>;
    getAllJobs: () => Promise<void>;
}

export const useRepoStore = create<RepoState>((set) => ({
    ingestingRepo: false,
    gettingAllJobs: false,
    allJobs: [],
    allReadyJobs: [],
    ingestRepo: async (repoUrl: string) => {
        set({ ingestingRepo: true });
        try {
            await axiosInstance.post("/repo/ingest", {
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
            toast.success(res.data.message ?? "All jobs fetched succesfully");
        } catch (err) {
            console.log("Error while getting all jobs ", err);
            toast.error("Error While getting all jobs");
        } finally {
            set({ gettingAllJobs: true });
        }
    },

    // getJobStatus : async (jobId:string) =>{

    // }
}));
