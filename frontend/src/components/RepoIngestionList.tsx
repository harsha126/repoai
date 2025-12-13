import React from "react";
import RepoIngestionItem from "./RepoIngestionItem";
import { useRepoStore } from "../store/useRepoStore";

export interface ApiResponse<T> {
    message: string;
    data: T;
}

export interface JobDTO {
    jobId: string;
    status: string;
    error?: string;
    repoId: string;
    repoUrl: string;
    owner: string;
}

const RepoIngestionList: React.FC = () => {
    const { allJobs, getAllJobs, gettingAllJobs } = useRepoStore();
    React.useEffect(() => {
        getAllJobs();
    }, [getAllJobs]);

    const cancelJob = async (jobId: string) => {};

    if (allJobs.length === 0) {
        return (
            <div className="text-slate-400 text-sm">
                No repository ingestion jobs yet.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {allJobs.map((job) => (
                <RepoIngestionItem
                    key={job.jobId}
                    job={job}
                    onCancel={cancelJob}
                />
            ))}
        </div>
    );
};

export default RepoIngestionList;
