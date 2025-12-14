import React, { useEffect } from "react";
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
    tokenCount?: number;
}

const RepoIngestionList: React.FC = () => {
    const { allJobs, getAllJobs, initializeSocket, cancelIngestion } =
        useRepoStore();

    useEffect(() => {
        getAllJobs();
        initializeSocket();
    }, [getAllJobs, initializeSocket]);

    const cancelJob = async (jobId: string) => {
        await cancelIngestion(jobId);
    };

    if (allJobs.length === 0) {
        return (
            <div className="text-base-content/50 text-sm italic p-4 text-center">
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
