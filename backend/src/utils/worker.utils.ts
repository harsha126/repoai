import fs from "fs/promises";
import { getEncoding } from "tiktoken";
import IORedis from "ioredis";
import {
    splitText,
    generateEmbedding,
    addChunksToRepo,
    generateRepoSummary,
} from "./index";
import { logger } from "../logger";
import { prisma } from "../prisma";
import { SavedFile } from "./index";
import { connection as redisPublisher } from "../queueConfig";
export const processFilesForEmbedding = async (
    files: SavedFile[],
    jobId: string
) => {
    let summarySources: string[] = [];
    const allChunksToSave = [];
    let processedFiles = 0;
    let skippedFiles = 0;
    let totalTokens = 0;

    // Initialize analyzer
    const enc = getEncoding("cl100k_base");

    for (const file of files) {
        try {
            const rawContent = await fs.readFile(file.fullPath, "utf-8");
            const textChunks = splitText(rawContent);

            const lowerPath = file.relativePath.toLowerCase();

            if (
                lowerPath.includes("readme") ||
                lowerPath.endsWith("package.json") ||
                lowerPath.endsWith("pom.xml") ||
                lowerPath.includes("main.") ||
                lowerPath.includes("index.") ||
                lowerPath.includes("app.") ||
                lowerPath.includes("application.") ||
                lowerPath.includes("config.")
            ) {
                summarySources.push(
                    `File: ${file.relativePath}\n\n${rawContent.slice(0, 4000)}`
                );
            }

            logger.info("File processed", {
                jobId,
                fileIndex: processedFiles + 1,
                totalFiles: files.length,
                chunksGenerated: textChunks.length,
            });

            for (const chunkText of textChunks) {
                const vector = await generateEmbedding(chunkText);

                const tokens = enc.encode(chunkText).length;
                totalTokens += tokens;

                allChunksToSave.push({
                    text: `File: ${file.relativePath}\n\n${chunkText}`,
                    embedding: vector,
                });
            }
            processedFiles++;

            const progress = Math.round((processedFiles / files.length) * 100);
            if (processedFiles % 5 === 0 || processedFiles === files.length) {
                redisPublisher.publish(
                    "job-updates",
                    JSON.stringify({
                        jobId,
                        type: "progress",
                        progress,
                        processedFiles,
                        totalFiles: files.length,
                        totalTokens,
                    })
                );
            }
        } catch (err: any) {
            skippedFiles++;
            logger.warn("File processing failed, skipping", {
                jobId,
                error: err.message,
                fileIndex: processedFiles + skippedFiles,
            });
        }
    }

    enc.free();

    logger.info("All files processed", {
        jobId,
        processedFiles,
        skippedFiles,
        totalChunks: allChunksToSave.length,
    });

    return {
        allChunksToSave,
        summarySources,
        processedFiles,
        skippedFiles,
        totalTokens,
    };
};

export const saveChunksInBatches = async (
    repoId: string,
    chunks: { text: string; embedding: number[] }[],
    jobId: string
) => {
    if (chunks.length > 0) {
        const BATCH_SIZE = 50;
        const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

        logger.info("Starting batch save", {
            jobId,
            totalChunks: chunks.length,
            batchSize: BATCH_SIZE,
            totalBatches,
        });

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
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
};

export const processRepoSummary = async (
    repoId: string,
    summarySources: string[],
    jobId: string
) => {
    if (summarySources.length > 0) {
        logger.info("Generating repository summary", {
            jobId,
            sourceFiles: summarySources.length,
        });

        const summary = await generateRepoSummary(summarySources);
        if (summary) {
            logger.info(summary);
            const rr = JSON.parse(summary || "{}");
            await prisma.repo.update({
                where: { id: repoId },
                data: {
                    summary: rr.summary,
                    keywords: rr.keywords,
                },
            });
        }

        logger.info("Repository summary saved", { jobId });
    } else {
        logger.warn("No summary sources found", { jobId });
    }
};
