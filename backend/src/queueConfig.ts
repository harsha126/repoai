import IORedis from "ioredis";
import { Queue } from "bullmq";

export const connection = new IORedis({
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null,
});

export const jobQueue = new Queue("repo-processor", { connection });

export const STEPS = {
    FETCH_REPO: "FETCH_REPO",
    PROCESS_EMBEDDINGS: "PROCESS_EMBEDDINGS",
    CLEANUP: "CLEANUP",
};

export const STATUS = {
    PENDING: "PENDING",
    DOWNLOADING: "DOWNLOADING",
    DOWNLOADED: "DOWNLOADED",
    EMBEDDING: "EMBEDDING",
    EMBEDDED: "EMBEDDED",
    CLEANING: "CLEANING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
};
