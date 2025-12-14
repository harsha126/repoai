import { Router } from "express";
import {
    getAllJobsForGivenUser,
    getJobStatus,
    ingestRepo,
    cancelJob,
} from "../controllers/repo.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const repoRouter = Router();

repoRouter.post("/ingest", authenticateToken, ingestRepo);
repoRouter.get("/status/:id", authenticateToken, getJobStatus);
repoRouter.get("/job", authenticateToken, getAllJobsForGivenUser);
repoRouter.post("/cancel/:id", authenticateToken, cancelJob);

export default repoRouter;
