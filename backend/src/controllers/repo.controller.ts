import { Request, Response } from "express";
import { prisma } from "../prisma";
import { extractGitHubRepoInfo } from "../utils";
import { AuthUser } from "../types/auth";
import { jobQueue, STATUS, STEPS } from "../queueConfig";
import { ApiResponse, JobDTO } from "../types/response";

export const ingestRepo = async (req: Request, res: Response) => {
    const { repoUrl, token } = req.body;
    try {
        console.log(`Ingesting repository from URL: ${repoUrl}`);
        const user: AuthUser = req.user;
        if (!user) {
            return res.status(401).json({ message: "UnAuthorized" });
        }
        if (!repoUrl) {
            return res
                .status(400)
                .json({ message: "Repository URL is required" });
        }

        const gitHubUrlPattern =
            /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/)?$/;
        if (!gitHubUrlPattern.test(repoUrl)) {
            return res
                .status(400)
                .json({ message: "Invalid GitHub repository URL" });
        }

        const { owner, repo } = extractGitHubRepoInfo(repoUrl);

        const savedRepo = await prisma.repo.create({
            data: {
                url: repoUrl,
                owner,
                branch: "main",
                userId: user.id,
            },
        });

        const job = await prisma.job.create({
            data: {
                repoId: savedRepo.id,
                status: STATUS.PENDING,
            },
        });

        await jobQueue.add("init-job", {
            jobId: job.id,
            step: STEPS.FETCH_REPO,
            payload: { owner, repo, token, repoId: savedRepo.id },
        });

        return res.status(200).json({
            message: "SucessFully started ingesting the repo",
            jobId: job.id,
            repoId: savedRepo.id,
        });
    } catch (err) {
        console.error("Error ingesting repository:", err);
        res.status(500).json({ message: "Internal Server error" });
    }
};

export const getAllJobsForGivenUser = async (req: Request, res: Response) => {
    const user: AuthUser = req.user;
    if (!user) {
        return res.status(404).json({ message: "Unauthenticated" });
    }
    const userId = user.id;
    const allJobs: JobDTO[] = [];
    const allRepos = await prisma.repo.findMany({ where: { userId } });
    for (const repo of allRepos) {
        const jobs = await prisma.job.findMany({ where: { repoId: repo.id } });
        for (const job of jobs) {
            allJobs.push({
                jobId: job.id,
                status: job.status,
                error: job.error || undefined,
                repoId: repo.id,
                repoUrl: repo.url,
                owner: repo.owner,
            });
        }
    }
    return res.status(200).json({
        message: "Successfully fetched all jobs for the user",
        data: allJobs,
    } as ApiResponse<JobDTO[]>);
};

export const getJobStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: "Job id is required" });
    }

    const job = await prisma.job.findUnique({
        where: {
            id,
        },
    });

    if (!job) {
        return res
            .status(404)
            .json({ message: "Job is missing for the given job id" });
    }

    return res
        .status(200)
        .json({ status: job.status, error: job.error, repoId: job.repoId });
};
