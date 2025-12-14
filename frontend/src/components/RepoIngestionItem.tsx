import React from "react";

interface Props {
    job: {
        jobId: string;
        status: string;
        error?: string;
        repoUrl: string;
        tokenCount?: number;
    };
    onCancel: (jobId: string) => void;
}

const statusToProgress = (status: string) => {
    switch (status) {
        case "PENDING":
            return 0;
        case "DOWNLOADING":
            return 12.5;
        case "DOWNLOADED":
            return 25;
        case "EMBEDDING":
            return 37.5;
        case "EMBEDDED":
            return 50;
        case "CLEANING":
            return 75;
        case "COMPLETED":
            return 100;
        default:
            return 0;
    }
};

const statusColor = (status: string) => {
    switch (status) {
        case "COMPLETED":
            return "progress-success";
        case "FAILED":
            return "progress-error";
        case "IN_PROGRESS":
            return "progress-primary";
        default:
            return "progress-warning";
    }
};

const RepoIngestionItem: React.FC<Props> = ({ job, onCancel }) => {
    return (
        <div className="card bg-base-200 shadow-sm border border-base-300 p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 width-[50%]">
                    <p className="text-sm font-medium truncate text-wrap">
                        {job.repoUrl}
                    </p>
                    <p className="text-xs mt-1 text-base-content/60">
                        Status:{" "}
                        <span className="font-medium text-base-content">
                            {job.status}
                        </span>
                    </p>
                    {job.tokenCount !== undefined && (
                        <p className="text-xs mt-1 text-base-content/60">
                            Tokens:{" "}
                            <span className="font-medium text-base-content">
                                {job.tokenCount}
                            </span>
                        </p>
                    )}
                </div>

                {job.status !== "COMPLETED" && job.status !== "FAILED" && (
                    <button
                        onClick={() => onCancel(job.jobId)}
                        className="btn btn-xs btn-outline btn-error normal-case"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <progress
                className={`progress ${statusColor(job.status)} w-full mt-3`}
                value={statusToProgress(job.status)}
                max={100}
            />

            {job.error && (
                <p className="text-xs text-error mt-2">Error: {job.error}</p>
            )}
        </div>
    );
};

export default RepoIngestionItem;
