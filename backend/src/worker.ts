import { Worker } from "bullmq";
import { connection, jobQueue, STEPS, STATUS } from "./queueConfig";
import { prisma } from "./prisma";
import { downloadRepoToTemp } from "./utils";
import {
    processFilesForEmbedding,
    saveChunksInBatches,
    processRepoSummary,
} from "./utils/worker.utils";
import fs from "fs/promises";
import { logger } from "./logger";
import { connection as redisPublisher } from "./queueConfig";

class CancelError extends Error {
    constructor() {
        super("Job was cancelled by user");
        this.name = "CancelError";
    }
}

async function assertNotCancelled(jobId: string) {
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { status: true },
    });

    if (!job || job.status === "CANCELLED") {
        throw new CancelError();
    }
}
interface IJob {
    jobId: string;
    step: string;
    payload: Record<string, any>;
}

const worker = new Worker(
    "repo-processor",
    async (job) => {
        const { jobId, step, payload } = job.data;
        await assertNotCancelled(jobId);
        logger.info("Job started", { jobId, step });

        try {
            switch (step) {
                case STEPS.FETCH_REPO: {
                    logger.info("Starting repository download", {
                        jobId,
                        step,
                    });

                    await prisma.job.update({
                        where: { id: jobId },
                        data: { status: STATUS.DOWNLOADING },
                    });
                    logger.info("Job status updated", {
                        jobId,
                        status: STATUS.DOWNLOADING,
                    });

                    await redisPublisher.publish(
                        "job-updates",
                        JSON.stringify({
                            jobId,
                            type: "status",
                            status: STATUS.DOWNLOADING,
                        })
                    );

                    const { tempDir, files } = await downloadRepoToTemp(
                        payload.owner,
                        payload.repo,
                        payload.token
                    );
                    logger.info("Repository downloaded successfully", {
                        jobId,
                        fileCount: files.length,
                        hasTempDir: !!tempDir,
                    });

                    await prisma.job.update({
                        where: { id: jobId },
                        data: {
                            status: STATUS.DOWNLOADED,
                            localPath: tempDir,
                        },
                    });
                    logger.info("Job status updated", {
                        jobId,
                        status: STATUS.DOWNLOADED,
                    });
                    await redisPublisher.publish(
                        "job-updates",
                        JSON.stringify({
                            jobId,
                            type: "status",
                            status: STATUS.DOWNLOADED,
                        })
                    );

                    await jobQueue.add("next-step", {
                        jobId,
                        step: STEPS.PROCESS_EMBEDDINGS,
                        payload: {
                            ...payload,
                            tempDir,
                            files,
                        },
                    });
                    logger.info("Next step queued", {
                        jobId,
                        nextStep: STEPS.PROCESS_EMBEDDINGS,
                    });

                    break;
                }

                case STEPS.PROCESS_EMBEDDINGS: {
                    logger.info("Starting embedding processing", {
                        jobId,
                        step,
                    });

                    const { files, repoId } = payload;
                    if (!repoId) {
                        logger.error("Missing repoId in payload", null, {
                            jobId,
                        });
                        throw new Error("repoId is missing in job payload");
                    }

                    await prisma.job.update({
                        where: { id: jobId },
                        data: { status: STATUS.EMBEDDING },
                    });
                    logger.info("Job status updated", {
                        jobId,
                        status: STATUS.EMBEDDING,
                    });
                    await redisPublisher.publish(
                        "job-updates",
                        JSON.stringify({
                            jobId,
                            type: "status",
                            status: STATUS.EMBEDDING,
                        })
                    );

                    const { allChunksToSave, summarySources, totalTokens } =
                        await processFilesForEmbedding(files, jobId);

                    await saveChunksInBatches(repoId, allChunksToSave, jobId);

                    await processRepoSummary(repoId, summarySources, jobId);

                    // Update repo with token count
                    await prisma.repo.update({
                        where: { id: repoId },
                        data: {
                            tokenCount: totalTokens,
                        },
                    });

                    await prisma.job.update({
                        where: { id: jobId },
                        data: { status: STATUS.EMBEDDED },
                    });
                    logger.info("Job status updated", {
                        jobId,
                        status: STATUS.EMBEDDED,
                    });
                    await redisPublisher.publish(
                        "job-updates",
                        JSON.stringify({
                            jobId,
                            type: "status",
                            status: STATUS.EMBEDDED,
                        })
                    );

                    await jobQueue.add("next-step", {
                        jobId,
                        step: STEPS.CLEANUP,
                        payload: { tempDir: payload.tempDir },
                    });
                    logger.info("Next step queued", {
                        jobId,
                        nextStep: STEPS.CLEANUP,
                    });

                    break;
                }

                case STEPS.CLEANUP: {
                    logger.info("Starting cleanup", { jobId, step });

                    await prisma.job.update({
                        where: { id: jobId },
                        data: { status: STATUS.CLEANING },
                    });
                    logger.info("Job status updated", {
                        jobId,
                        status: STATUS.CLEANING,
                    });
                    await redisPublisher.publish(
                        "job-updates",
                        JSON.stringify({
                            jobId,
                            type: "status",
                            status: STATUS.CLEANING,
                        })
                    );

                    if (payload.tempDir) {
                        await fs.rm(payload.tempDir, {
                            recursive: true,
                            force: true,
                        });
                        logger.info("Temporary directory deleted", { jobId });
                    } else {
                        logger.warn("No temporary directory to clean", {
                            jobId,
                        });
                    }

                    await prisma.job.update({
                        where: { id: jobId },
                        data: { status: STATUS.COMPLETED },
                    });
                    logger.info("Job completed successfully", {
                        jobId,
                        status: STATUS.COMPLETED,
                    });
                    await redisPublisher.publish(
                        "job-updates",
                        JSON.stringify({
                            jobId,
                            type: "status",
                            status: STATUS.COMPLETED,
                        })
                    );

                    break;
                }

                default: {
                    logger.warn("Unknown step encountered", { jobId, step });
                    break;
                }
            }
        } catch (err) {
            if (err instanceof CancelError) {
                console.log(`Job ${jobId} cancelled. Cleaning up...`);
                await redisPublisher.publish(
                    "job-updates",
                    JSON.stringify({
                        jobId,
                        type: "status",
                        status: STATUS.FAILED,
                    })
                );
                if (payload.tempDir) {
                    await fs
                        .rm(payload.tempDir, { recursive: true, force: true })
                        .catch(() => {});
                }

                await prisma.job.update({
                    where: { id: jobId },
                    data: { status: "CANCELLED_AND_CLEANED" },
                });

                return;
            }
            logger.error("Job failed", err, { jobId, step });

            await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: STATUS.FAILED,
                    error: (err as Error).message,
                },
            });

            await redisPublisher.publish(
                "job-updates",
                JSON.stringify({
                    jobId,
                    type: "status",
                    status: STATUS.FAILED,
                })
            );

            throw err;
        }
    },
    {
        connection,
    }
);

logger.info("Worker started", { workerName: "repo-processor" });
