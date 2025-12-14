import React from "react";
import { useRepoStore } from "../store/useRepoStore";

const RepoChatList = () => {
    const { allReadyJobs } = useRepoStore();
    return (
        <div>
            {allReadyJobs.map((job) => (
                <div className="bg-[#111318] rounded-lg p-4 border border-slate-700 mb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-sm text-slate-300 truncate">
                                {job.repoUrl}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RepoChatList;
