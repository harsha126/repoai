import { Request, Response } from "express";
import { prisma } from "../prisma";
import { extractGitHubRepoInfo } from "../utils";
import { AuthUser } from "../types/auth";
import { jobQueue, STATUS, STEPS } from "../queueConfig";
import { ApiResponse, JobDTO } from "../types/response";
import { logger } from "../logger";

export const ingestRepo = async (req: Request, res: Response) => {
    const { repoUrl, token } = req.body;
    try {
        logger.info(`Ingesting repository from URL: ${repoUrl}`);
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
    } catch (err: any) {
        logger.error("Error ingesting repository:", err);
        res.status(500).json({ message: "Internal Server error" });
    }
};

export const getAllJobsForGivenUser = async (req: Request, res: Response) => {
    const user: AuthUser = req.user;
    if (!user) {
        return res.status(404).json({ message: "Unauthenticated" });
    }
    const userId = user.id;

    try {
        const jobs = await prisma.job.findMany({
            where: {
                repo: {
                    userId: userId,
                },
            },
            include: {
                repo: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const allJobs: JobDTO[] = jobs.map((job) => ({
            jobId: job.id,
            status: job.status,
            error: job.error || undefined,
            repoId: job.repoId,
            repoUrl: job.repo.url,
            owner: job.repo.owner,
        }));

        return res.status(200).json({
            message: "Successfully fetched all jobs for the user",
            data: allJobs,
        } as ApiResponse<JobDTO[]>);
    } catch (error: any) {
        logger.error("Error fetching jobs for user", error, { userId });
        return res.status(500).json({ message: "Internal Server Error" });
    }
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
