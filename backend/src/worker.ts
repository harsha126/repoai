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

interface IJob {
    jobId: string;
    step: string;
    payload: Record<string, string>;
}

const worker = new Worker(
    "repo-processor",
    async (job) => {
        const { jobId, step, payload, repoId } = job.data;
        try {
            switch (step) {
                case STEPS.FETCH_REPO: {
                    await prisma.job.update({
                        where: {
                            id: jobId,
                        },
                        data: {
                            status: STATUS.DOWNLOADING,
                        },
                    });

                    const { tempDir, files } = await downloadRepoToTemp(
                        payload.owner,
                        payload.repo,
                        payload.token
                    );

                    await prisma.job.update({
                        where: {
                            id: jobId,
                        },
                        data: {
                            status: STATUS.DOWNLOADED,
                            localPath: tempDir,
                        },
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

                    break;
                }

                case STEPS.PROCESS_EMBEDDINGS: {
                    const { files } = payload;
                    if (!repoId)
                        throw new Error("repoId is missing in job payload");
                    await prisma.job.update({
                        where: {
                            id: jobId,
                        },
                        data: {
                            status: STATUS.EMBEDDING,
                        },
                    });
                    const allChunksToSave = [];
                    for (const file of files) {
                        try {
                            const rawContent = await fs.readFile(
                                file.fullPath,
                                "utf-8"
                            );
                            const textChunks = splitText(rawContent);
                            for (const chunkText of textChunks) {
                                const vector = await generateEmbedding(
                                    chunkText
                                );
                                allChunksToSave.push({
                                    text: `File: ${file.relativePath}\n\n${chunkText}`,
                                    embedding: vector,
                                });
                            }
                        } catch (err: any) {
                            console.error(
                                `Skipping file ${file.relativePath}: ${err.message}`
                            );
                        }
                    }
                    if (allChunksToSave.length > 0) {
                        const BATCH_SIZE = 50;
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
                            console.log(
                                `[Worker] Saved batch ${i} - ${
                                    i + batch.length
                                }`
                            );
                        }
                    }

                    await prisma.job.update({
                        where: {
                            id: jobId,
                        },
                        data: {
                            status: STATUS.EMBEDDED,
                        },
                    });

                    await jobQueue.add("next-step", {
                        jobId,
                        step: STEPS.CLEANUP,
                        payload: { tempDir: payload.tempDir },
                    });
                    break;
                }
                case STEPS.CLEANUP: {
                    await prisma.job.update({
                        where: {
                            id: jobId,
                        },
                        data: {
                            status: STATUS.CLEANING,
                        },
                    });

                    if (payload.tempDir) {
                        await fs.rm(payload.tempDir, {
                            recursive: true,
                            force: true,
                        });
                        console.log(
                            `[Worker] Deleted temp folder: ${payload.tempDir}`
                        );
                    }

                    await prisma.job.update({
                        where: {
                            id: jobId,
                        },
                        data: {
                            status: STATUS.COMPLETED,
                        },
                    });
                    console.log(`[Worker] Job ${jobId} FULLY COMPLETE.`);
                    break;
                }
                default: {
                    console.log(`[Worker] Job ${jobId} STEP UNKNOWN: ${step}`);
                    break;
                }
            }
        } catch (err) {
            console.error(`[Worker] Failed at ${step}:`, err);
            await prisma.job.update({
                where: { id: jobId },
                data: { status: STATUS.FAILED, error: (err as Error).message },
            });
            throw err;
        }
    },
    {
        connection,
    }
);

console.log("Worker started...");
