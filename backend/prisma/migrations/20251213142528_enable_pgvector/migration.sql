-- 1. Enable the pgvector extension (Must be first)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the RepoChunck table
CREATE TABLE "RepoChunck" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "embeddings" vector(1536), -- Prisma renders this from Unsupported type
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepoChunck_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RepoChunck" ADD CONSTRAINT "RepoChunck_repoId_fkey" 
FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. (Highly Recommended) Add an HNSW Index for faster vector search
-- Without this, queries will be very slow as data grows
CREATE INDEX "RepoChunck_embeddings_idx" 
ON "RepoChunck" 
USING hnsw ("embeddings" vector_cosine_ops);