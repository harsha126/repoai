import { Request, Response } from "express";
import {
    askRepoAI,
    buildRepoContext,
    formatChatHistory,
    generateEmbedding,
    isOverviewQuestion,
    RepoChunkResult,
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
    if (isOverviewQuestion(currentMessage)) {
        const repo = await prisma.repo.findUnique({
            where: { id: repoId },
            select: { summary: true },
        });

        return res.json({
            answer: repo?.summary ?? "Summary not available.",
        });
    }
    const queryEmbeddings = await generateEmbedding(currentMessage);
    const topkChucks: RepoChunkResult[] = await searchRepoChunks(
        repoId,
        queryEmbeddings
    );
    if (!topkChucks || topkChucks.length <= 3) {
        const repo = await prisma.repo.findFirst({
            where: {
                id: repoId,
            },
        });
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
    console.log(queryContext);
    const formattedChatHistory =
        chatHistory && chatHistory.length > 0
            ? formatChatHistory(chatHistory)
            : "No History yet";

    const aiRes = await askRepoAI(
        queryContext,
        formattedChatHistory,
        currentMessage
    );
    return res.json({
        answer: aiRes,
        sources: topkChucks.map((c) => ({
            similarity: c.similarity,
        })),
    });
};
