import { Router } from "express";
import {
    getAllJobsForGivenUser,
    getJobStatus,
    ingestRepo,
} from "../controllers/repo.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const repoRouter = Router();

repoRouter.post("/ingest", authenticateToken, ingestRepo);
repoRouter.get("/status/:id", authenticateToken, getJobStatus);
repoRouter.get("/job", authenticateToken, getAllJobsForGivenUser);

export default repoRouter;
