import { Worker } from "bullmq";
import { connection, jobQueue, STEPS, STATUS } from "./queueConfig";
import { prisma } from "./prisma";
import {
    addChunksToRepo,
    downloadRepoToTemp,
    generateEmbedding,
    splitText,
} from "./utils";
import fs from "fs/promises";
import { logger } from "./logger";

interface IJob {
    jobId: string;
    step: string;
    payload: Record<string, string>;
}

const worker = new Worker(
    "repo-processor",
    async (job) => {
        const { jobId, step, payload } = job.data;

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

                    const allChunksToSave = [];
                    let processedFiles = 0;
                    let skippedFiles = 0;

                    for (const file of files) {
                        try {
                            const rawContent = await fs.readFile(
                                file.fullPath,
                                "utf-8"
                            );
                            const textChunks = splitText(rawContent);

                            logger.info("File processed", {
                                jobId,
                                fileIndex: processedFiles + 1,
                                totalFiles: files.length,
                                chunksGenerated: textChunks.length,
                            });

                            for (const chunkText of textChunks) {
                                const vector = await generateEmbedding(
                                    chunkText
                                );
                                allChunksToSave.push({
                                    text: `File: ${file.relativePath}\n\n${chunkText}`,
                                    embedding: vector,
                                });
                            }
                            processedFiles++;
                        } catch (err: any) {
                            skippedFiles++;
                            logger.warn("File processing failed, skipping", {
                                jobId,
                                error: err.message,
                                fileIndex: processedFiles + skippedFiles,
                            });
                        }
                    }

                    logger.info("All files processed", {
                        jobId,
                        processedFiles,
                        skippedFiles,
                        totalChunks: allChunksToSave.length,
                    });

                    if (allChunksToSave.length > 0) {
                        const BATCH_SIZE = 50;
                        const totalBatches = Math.ceil(
                            allChunksToSave.length / BATCH_SIZE
                        );

                        logger.info("Starting batch save", {
                            jobId,
                            totalChunks: allChunksToSave.length,
                            batchSize: BATCH_SIZE,
                            totalBatches,
                        });

                        for (
                            let i = 0;
                            i < allChunksToSave.length;
                            i += BATCH_SIZE
                        ) {
                            const batch = allChunksToSave.slice(
                                i,
                                i + BATCH_SIZE
                            );
                            await addChunksToRepo(repoId, batch);

                            logger.info("Batch saved", {
                                jobId,
                                batchNumber: Math.floor(i / BATCH_SIZE) + 1,
                                totalBatches,
                                chunksInBatch: batch.length,
                                chunksSavedSoFar: i + batch.length,
                            });
                        }
                    } else {
                        logger.warn("No chunks to save", { jobId });
                    }

                    await prisma.job.update({
                        where: { id: jobId },
                        data: { status: STATUS.EMBEDDED },
                    });
                    logger.info("Job status updated", {
                        jobId,
                        status: STATUS.EMBEDDED,
                    });

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

                    break;
                }

                default: {
                    logger.warn("Unknown step encountered", { jobId, step });
                    break;
                }
            }
        } catch (err) {
            logger.error("Job failed", err, { jobId, step });

            await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: STATUS.FAILED,
                    error: (err as Error).message,
                },
            });

            throw err;
        }
    },
    {
        connection,
    }
);

logger.info("Worker started", { workerName: "repo-processor" });
