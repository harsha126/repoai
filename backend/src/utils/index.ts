import jwt from "jsonwebtoken";
import { User } from "../generated/prisma/client";
import { Response } from "express";
import unzipper from "unzipper";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { prisma } from "../prisma";
import OpenAI from "openai";
import { logger } from "../logger";

export interface SavedFile {
    relativePath: string;
    fullPath: string;
}

export interface DownloadResult {
    tempDir: string;
    files: SavedFile[];
}

interface GitHubRepoInfo {
    owner: string;
    repo: string;
}

export type RepoChunkResult = {
    id: string;
    repoId: string;
    content: string;
    similarity: number;
};

// const SYSTEM_PROMPT = `
// You are an AI assistant that answers questions ONLY using the provided repository context.

// Rules:
// - Repository Context is the ONLY source of truth.
// - Conversation History is for understanding the user's intent only.
// - If the answer is not present in the repository context, say:
//   "I could not find this information in the repository. can you please be more specific"
// - Do NOT rely on previous answers as facts.
// - Do NOT hallucinate or assume behavior.

// Be concise and technical.
// `;

const SYSTEM_PROMPT = `
You are an AI assistant helping a developer understand a codebase.

Rules:
- Base your answer on the repository context.
- You may infer behavior from related files and patterns.
- If the integration is indirect, explain how components likely interact.
- If the answer is not relevant to the repository context, say:
    "I could not find this information in the repository. can you please be more specific"
- Clearly say when something is inferred, not explicitly stated.
- Do NOT invent functionality that is not supported by the code.
- Do NOT rely on previous answers as facts.
- Do NOT hallucinate or assume behavior.

   Be concise and technical.

`;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
    logger.info("Generating embedding", { textLength: text.length });

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, " "),
        });

        logger.info("Embedding generated successfully", {
            embeddingDimensions: response.data[0].embedding.length,
        });

        return response.data[0].embedding;
    } catch (error) {
        logger.error("Failed to generate embedding", error, {
            textLength: text.length,
        });
        throw error;
    }
}

export const generateToken = (user: User, res: Response) => {
    logger.info("Generating JWT token", { userId: user.id });

    try {
        const token = jwt.sign(
            { id: user.id, name: user.name },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000 * 24 * 7,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        logger.info("JWT token generated and cookie set", {
            userId: user.id,
            expiresIn: "7d",
        });

        return token;
    } catch (error) {
        logger.error("Failed to generate token", error, { userId: user.id });
        throw error;
    }
};

export function extractGitHubRepoInfo(url: string): GitHubRepoInfo {
    logger.info("Extracting GitHub repo info from URL");

    if (!url || typeof url !== "string") {
        logger.error("Invalid URL provided", null, { urlType: typeof url });
        throw new Error("Invalid URL provided");
    }

    const trimmedUrl = url.trim();
    const githubRegex = /github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/;
    const match = trimmedUrl.match(githubRegex);

    if (!match) {
        logger.error("Not a valid GitHub repository URL");
        throw new Error("Not a valid GitHub repository URL");
    }

    const owner = match[1];
    const repo = match[2];

    if (!owner || !repo) {
        logger.error("Could not extract owner or repository name");
        throw new Error("Could not extract owner or repository name");
    }

    logger.info("GitHub repo info extracted successfully", { owner, repo });

    return { owner, repo };
}

const isBinary = (filePath: string): boolean => {
    const ext = path.extname(filePath).toLowerCase();
    const binaryExtensions = [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".bmp",
        ".ico",
        ".svg",
        ".zip",
        ".tar",
        ".gz",
        ".7z",
        ".rar",
        ".exe",
        ".dll",
        ".so",
        ".bin",
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".mp3",
        ".mp4",
        ".avi",
        ".mov",
        ".wav",
        ".eot",
        ".ttf",
        ".woff",
        ".woff2",
    ];
    return binaryExtensions.includes(ext);
};

export async function downloadRepoToTemp(
    owner: string,
    repo: string,
    token: string
): Promise<DownloadResult> {
    logger.info("Starting repository download", { owner, repo });

    const branches = ["main", "master", "develop"];
    const uniqueId = `${owner}-${repo}-${Date.now()}`;
    const tempDir = path.join(os.tmpdir(), "repo-dl", uniqueId);

    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        logger.info("Using authenticated request");
    } else {
        logger.warn("No token provided, using unauthenticated request");
    }

    let lastError: any;

    // Try each branch until one succeeds
    for (const branch of branches) {
        try {
            const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;
            logger.info("Fetching repository from GitHub", {
                owner,
                repo,
                branch,
            });

            const response = await axios({
                method: "get",
                url,
                responseType: "stream",
                headers,
            });

            logger.info("Repository fetched, starting extraction", {
                owner,
                repo,
                branch,
                tempDir,
            });

            const savedFiles: SavedFile[] = [];
            let binaryFilesSkipped = 0;

            await response.data
                .pipe(unzipper.Parse())
                .on("entry", async (entry: any) => {
                    const type = entry.type;
                    if (type === "File" && !isBinary(entry.path)) {
                        const fullPath = path.join(tempDir, entry.path);
                        fs.mkdirSync(path.dirname(fullPath), {
                            recursive: true,
                        });
                        entry.pipe(fs.createWriteStream(fullPath));
                        savedFiles.push({
                            relativePath: entry.path,
                            fullPath: fullPath,
                        });
                    } else {
                        if (type === "File") {
                            binaryFilesSkipped++;
                        }
                        entry.autodrain();
                    }
                })
                .promise();

            logger.info("Repository download completed", {
                owner,
                repo,
                branch,
                filesExtracted: savedFiles.length,
                binaryFilesSkipped,
                tempDir,
            });

            return { tempDir, files: savedFiles };
        } catch (error: any) {
            lastError = error;
            logger.warn("Failed to download with branch, trying next", {
                owner,
                repo,
                branch,
                error: error.message,
            });
        }
    }

    logger.error("Failed to download repository from all branches", lastError, {
        owner,
        repo,
        branches,
    });
    throw new Error(
        `Failed to download ${owner}/${repo}. Tried branches: ${branches.join(
            ", "
        )}`
    );
}

export function formatVector(embedding: number[]): string {
    return JSON.stringify(embedding);
}

export async function addChunksToRepo(
    repoId: string,
    chunks: { text: string; embedding: number[] }[]
) {
    logger.info("Adding chunks to repository", {
        repoId,
        chunkCount: chunks.length,
    });

    try {
        const values = chunks.map((chunk) => {
            const id = crypto.randomUUID();
            const vectorStr = formatVector(chunk.embedding);
            const safeContent = chunk.text.replace(/'/g, "''");
            return `('${id}', '${repoId}', '${safeContent}', '${vectorStr}'::vector, NOW(), NOW())`;
        });

        const query = `
    INSERT INTO "RepoChunck" ("id", "repoId", "content", "embeddings", "createdAt", "updatedAt")
    VALUES 
      ${values.join(",")}
  `;

        await prisma.$executeRawUnsafe(query);

        logger.info("Chunks added successfully", {
            repoId,
            chunkCount: chunks.length,
        });
    } catch (error) {
        logger.error("Failed to add chunks to repository", error, {
            repoId,
            chunkCount: chunks.length,
        });
        throw error;
    }
}

export async function searchRepoChunks(
    repoId: string,
    queryEmbedding: number[],
    limit = 5
): Promise<RepoChunkResult[]> {
    logger.info("Searching repository chunks", {
        repoId,
        limit,
        embeddingDimensions: queryEmbedding.length,
    });

    const vectorStr = formatVector(queryEmbedding);

    try {
        const result = await prisma.$queryRawUnsafe<RepoChunkResult[]>(
            `
      WITH query_vec AS (
        SELECT '${vectorStr}'::vector AS v
      )
      SELECT
        rc.id,
        rc."repoId",
        rc.content,
        1 - (rc.embeddings <=> q.v) AS similarity
      FROM "RepoChunck" rc, query_vec q
      WHERE rc."repoId" = $1
      ORDER BY rc.embeddings <=> q.v
      LIMIT $2;
    `,
            repoId,
            limit
        );

        logger.info("Search completed", {
            repoId,
            resultsFound: result.length,
            topSimilarity: result[0]?.similarity ?? 0,
        });

        return result;
    } catch (error) {
        logger.error("Failed to search repository chunks", error, {
            repoId,
            limit,
        });
        throw error;
    }
}

export const buildRepoContext = (chunks: RepoChunkResult[]) => {
    logger.info("Building repository context", { chunkCount: chunks.length });

    const context = chunks
        .map((chunk, index) => {
            return `
                    ### Context ${
                        index + 1
                    } (similarity: ${chunk.similarity.toFixed(3)})
                    ${chunk.content}
                    `;
        })
        .join("\n");

    logger.info("Repository context built", {
        chunkCount: chunks.length,
        contextLength: context.length,
    });

    return context;
};

export const buildUserPrompt = (
    context: string,
    chatHistory: string,
    currentQuestion: string
) => {
    logger.info("Building user prompt", {
        contextLength: context.length,
        historyLength: chatHistory.length,
        questionLength: currentQuestion.length,
    });

    return `
            Repository Context:
            ${context}

            Conversation History (for reference only):
            ${chatHistory}

            Current Question:
            ${currentQuestion}
`;
};

export function splitText(
    text: string,
    chunkSize = 1000,
    overlap = 200
): string[] {
    logger.info("Splitting text into chunks", {
        textLength: text.length,
        chunkSize,
        overlap,
    });

    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }

    logger.info("Text split completed", {
        chunksGenerated: chunks.length,
        textLength: text.length,
    });

    return chunks;
}

export const askRepoAI = async (
    context: string,
    question: string,
    history: string
) => {
    logger.info("Sending request to OpenAI", {
        contextLength: context.length,
        questionLength: question.length,
        historyLength: history.length,
        model: "gpt-4o-mini",
    });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: buildUserPrompt(context, history, question),
                },
            ],
        });

        const answer = completion.choices[0].message.content;

        logger.info("OpenAI response received", {
            answerLength: answer?.length || 0,
            tokensUsed: completion.usage?.total_tokens || 0,
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
        });

        return answer;
    } catch (error) {
        logger.error("Failed to get response from OpenAI", error);
        throw error;
    }
};

export const formatChatHistory = (chatHistory: any[]) => {
    logger.info("Formatting chat history", {
        totalMessages: chatHistory?.length || 0,
        messagesUsed: Math.min(chatHistory?.length || 0, 2),
    });

    if (!chatHistory || chatHistory.length === 0) {
        logger.info("No chat history to format");
        return "";
    }

    const formatted = chatHistory
        .slice(-2)
        .map(
            (h, i) => `
                    Previous Question ${i + 1}:
                    ${h.question}

                    Previous Answer ${i + 1}:
                    ${h.answer}
                    `
        )
        .join("\n");

    logger.info("Chat history formatted", {
        formattedLength: formatted.length,
    });

    return formatted;
};

export async function generateRepoSummary(texts: string[]) {
    const prompt = `
You are a senior software engineer.

firstly 

Based ONLY on the following repository files,
write a concise technical summary explaining:

- What this repository does
- Its main purpose
- Key technologies used
- Who this project is for

Do NOT guess.
If information is missing, say so.

Repository Content:
${texts.join("\n\n")}

secondly based on the content given create a array of ten keywords , needs to be unique , relevant to content like 

- technology used
- packages used
- languages used
- system design principles used

your output needs to in json format only 

here is a example response 

{
    "summary" : "this is a example summary ....",
    "keywords" : ["react","java","python"]
}

follow the response pattern

`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
            {
                role: "system",
                content:
                    "You summarize and retrive keywords from software repositories.",
            },
            { role: "user", content: prompt },
        ],
    });

    return response.choices[0].message.content;
}

export function isOverviewQuestion(question: string) {
    const q = question.toLowerCase();

    return (
        q.includes("what is this repo") ||
        q.includes("what does this repo do") ||
        q.includes("purpose of this repo") ||
        q.includes("overview") ||
        q.includes("high level") ||
        q.includes("summary")
    );
}

export async function rewriteQuestion(question: string, summary: string) {
    const prompt = `
            You are a senior software engineer.

            Rewrite the following question into a more explicit
            code-search-friendly question.

            Original question:
            "${question}"

            Original Repository Summary
            "${summary}"

            Rewrite it to:
            - Mention possible technical terms
            - Mention frontend-backend interaction if relevant
            - Keep it short and precise to the question
            `;

    const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
    });

    return res.choices[0].message.content;
}
