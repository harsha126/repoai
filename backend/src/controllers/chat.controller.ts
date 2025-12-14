import { Request, Response } from "express";
import { logger } from "../logger";
import {
    askRepoAI,
    buildRepoContext,
    formatChatHistory,
    generateEmbedding,
    isOverviewQuestion,
    RepoChunkResult,
    rewriteQuestion,
    searchRepoChunks,
} from "../utils";
import { prisma } from "../prisma";

export const postMessage = async (req: Request, res: Response) => {
    const { repoId } = req.params;
    if (!repoId) {
        return res.status(400).json({ message: "Repo id is required" });
    }

    const { currentMessage, chatHistory } = req.body;
    if (!currentMessage) {
        return res
            .status(400)
            .json({ message: "At least one message is required" });
    }
    const repo = await prisma.repo.findUnique({
        where: { id: repoId },
        select: { summary: true, keywords: true },
    });
    if (isOverviewQuestion(currentMessage)) {
        return res.json({
            answer: repo?.summary ?? "Summary not available.",
        });
    }

    const enhancedQuestion = await rewriteQuestion(
        currentMessage,
        repo?.summary || ""
    );

    console.log(enhancedQuestion);
    const queryEmbeddings = await generateEmbedding(
        enhancedQuestion || currentMessage
    );
    const topkChucks: RepoChunkResult[] = await searchRepoChunks(
        repoId,
        queryEmbeddings
    );
    if (!topkChucks || topkChucks.length <= 3) {
        if (repo && repo.keywords) {
            const keywordChunks = await prisma.repoChunck.findMany({
                where: {
                    repoId,
                    OR: repo.keywords.map((keyword) => ({
                        content: {
                            contains: keyword,
                            mode: "insensitive",
                        },
                    })),
                },
            });

            const keyWordsEmbeddings = await generateEmbedding(
                keywordChunks.reduce((full, curr) => {
                    return full + curr + "\n";
                }, "")
            );
            const keywordEmChunks = await searchRepoChunks(
                repoId,
                keyWordsEmbeddings
            );

            topkChucks.push(...keywordEmChunks);
        }
    }
    const queryContext = buildRepoContext(topkChucks);
    logger.debug("Query Context built", { queryContext });
    const formattedChatHistory =
        chatHistory && chatHistory.length > 0
            ? formatChatHistory(chatHistory)
            : "No History yet";

    const aiRes = await askRepoAI(
        queryContext,
        formattedChatHistory,
        enhancedQuestion || currentMessage
    );
    return res.json({
        answer: aiRes,
        sources: topkChucks.map((c) => ({
            similarity: c.similarity,
        })),
    });
};
