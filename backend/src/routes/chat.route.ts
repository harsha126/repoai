import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { postMessage } from "../controllers/chat.controller";

const chatRouter = Router();

chatRouter.post("/message/:repoId",authenticateToken,postMessage)

export default chatRouter;