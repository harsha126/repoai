import { useRepoStore } from "../store/useRepoStore";
import { useChatStore } from "../store/useChatStore";

const RepoChatList = () => {
    const { allReadyJobs } = useRepoStore();
    const { currentRepo, setCurrentRepo } = useChatStore();
    return (
        <div>
            {allReadyJobs.map((job) => (
                <div
                    key={job.jobId}
                    className={`card bg-base-200 shadow-sm border border-base-300 mb-2 cursor-pointer transition-colors hover:bg-base-300
                        ${
                            currentRepo == job.repoId
                                ? "border-primary bg-base-300"
                                : ""
                        }`}
                    onClick={() => setCurrentRepo(job.repoId)}
                >
                    <div className="card-body p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium truncate">
                                    {job.repoUrl}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RepoChatList;
