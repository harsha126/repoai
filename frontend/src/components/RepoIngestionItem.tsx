import React from "react";

interface Props {
    job: {
        jobId: string;
        status: string;
        error?: string;
        repoUrl: string;
    };
    onCancel: (jobId: string) => void;
}

const statusToProgress = (status: string) => {
    switch (status) {
        case "QUEUED":
            return 20;
        case "IN_PROGRESS":
            return 60;
        case "COMPLETED":
            return 100;
        case "FAILED":
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
        <div className="bg-[#111318] rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <p className="text-sm text-slate-300 truncate">
                        {job.repoUrl}
                    </p>
                    <p className="text-xs mt-1 text-slate-400">
                        Status:{" "}
                        <span className="font-medium">{job.status}</span>
                    </p>
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
                <p className="text-xs text-red-400 mt-2">Error: {job.error}</p>
            )}
        </div>
    );
};

export default RepoIngestionItem;
