import { ExternalLink, Github, Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useRepoStore } from "../store/useRepoStore";
import RepoIngestionList from "./RepoIngestionList";

type FormValues = {
    repoUrl: string;
};

const DashBoard = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const { ingestRepo, ingestingRepo } = useRepoStore();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({
        defaultValues: { repoUrl: "" },
    });
    const openModal = () => setIsOpen(true);
    const closeModal = () => {
        setIsOpen(false);
        reset({ repoUrl: "" });
    };
    const onSubmit = async (data: FormValues) => {
        // Replace with your real handling (API call, parsing, etc.)
        // Example: validate further, fetch repo info, store, etc.
        console.log("GitHub URL submitted:", data.repoUrl);
        // Close afterwards
        ingestRepo(data.repoUrl);
        closeModal();
    };
    return (
        <div>
            <main className="p-8">
                <div className="max-w-4xl">
                    <h1 className="text-2xl font-bold mb-2">
                        Welcome to the Private Dashboard!
                    </h1>
                    <p className="text-sm text-slate-400 mb-6">
                        (You are authenticated)
                    </p>

                    {/* Add repo action */}
                    <div className="mb-6">
                        <button
                            onClick={openModal}
                            className="btn btn-primary normal-case gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add GitHub repo
                        </button>
                    </div>

                    {/* You can put dashboard contents here */}
                    <div className="h-[60vh] rounded-lg border border-transparent"></div>
                </div>
            </main>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="bg-[#111318] max-w-md w-full rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#2196f3] flex items-center justify-center">
                                    <Github className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-lg font-semibold">
                                    Add GitHub URL
                                </h2>
                            </div>

                            <button
                                onClick={closeModal}
                                className="btn btn-ghost btn-sm text-slate-300"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-3"
                        >
                            <label className="block text-sm text-slate-300">
                                GitHub repository URL
                            </label>

                            <div>
                                <input
                                    aria-invalid={!!errors.repoUrl}
                                    {...register("repoUrl", {
                                        required: "Repository URL is required",
                                        pattern: {
                                            value: /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/,
                                            message:
                                                "Enter a valid GitHub repo URL (e.g. https://github.com/user/repo)",
                                        },
                                    })}
                                    placeholder="https://github.com/user/repo"
                                    className={`input w-full bg-[#e6ebf3] text-black text-sm rounded-[4px] h-10 pr-10 mb-10 ${
                                        errors.repoUrl
                                            ? "ring-2 ring-red-500"
                                            : "focus:ring-2 focus:ring-[#2196f3]"
                                    }`}
                                />

                                {/* Icon on right */}
                                <div className="relative -mt-10">
                                    <div className="absolute right-2 bottom-1 -translate-y-1/2 text-slate-600 z-20">
                                        <ExternalLink className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {errors.repoUrl && (
                                <p className="text-red-400 text-xs">
                                    {errors.repoUrl.message}
                                </p>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn btn-ghost normal-case"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={ingestingRepo}
                                    className="btn btn-primary normal-case"
                                >
                                    Add Repo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <RepoIngestionList />
        </div>
    );
};

export default DashBoard;
