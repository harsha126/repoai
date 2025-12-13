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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, " "),
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}


export const generateToken = (user: User, res: Response) => {
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
    return token;
};

export function extractGitHubRepoInfo(url: string): GitHubRepoInfo {
    if (!url || typeof url !== "string") {
        throw new Error("Invalid URL provided");
    }
    const trimmedUrl = url.trim();
    const githubRegex = /github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/;
    const match = trimmedUrl.match(githubRegex);
    if (!match) {
        throw new Error("Not a valid GitHub repository URL");
    }
    const owner = match[1];
    const repo = match[2];
    if (!owner || !repo) {
        throw new Error("Could not extract owner or repository name");
    }
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
    const url = `https://api.github.com/repos/${owner}/${repo}/zipball/main`;
    const uniqueId = `${owner}-${repo}-${Date.now()}`;
    const tempDir = path.join(os.tmpdir(), "repo-dl", uniqueId);

    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios({
        method: "get",
        url,
        responseType: "stream",
        headers,
    });

    const savedFiles: SavedFile[] = [];

    await response.data
        .pipe(unzipper.Parse())
        .on("entry", async (entry: any) => {
            const type = entry.type;
            if (type === "File" && !isBinary(entry.path)) {
                const fullPath = path.join(tempDir, entry.path);
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                entry.pipe(fs.createWriteStream(fullPath));
                savedFiles.push({
                    relativePath: entry.path,
                    fullPath: fullPath,
                });
            } else {
                entry.autodrain();
            }
        })
        .promise();

    return { tempDir, files: savedFiles };
}

export function formatVector(embedding: number[]): string {
    return JSON.stringify(embedding);
}

export async function addChunksToRepo(
    repoId: string,
    chunks: { text: string; embedding: number[] }[]
) {
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
}

export async function searchRepoChunks(
    repoId: string,
    queryEmbedding: number[],
    limit = 5
) {
    const vectorStr = formatVector(queryEmbedding);

    const result = await prisma.$queryRaw`
    SELECT 
      id, 
      "repoId", 
      content,
      1 - (embeddings <=> ${vectorStr}::vector) as similarity
    FROM "RepoChunck"
    WHERE "repoId" = ${repoId}
    ORDER BY embeddings <=> ${vectorStr}::vector
    LIMIT ${limit};
  `;

    return result;
}

export function splitText(
    text: string,
    chunkSize = 1000,
    overlap = 200
): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}
