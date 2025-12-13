import { Router } from "express";
import { getJobStatus, ingestRepo } from "../controllers/repo.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const repoRouter = Router();

repoRouter.post("/ingest", authenticateToken, ingestRepo);
repoRouter.get("/status/:id", authenticateToken, getJobStatus);

export default repoRouter;
