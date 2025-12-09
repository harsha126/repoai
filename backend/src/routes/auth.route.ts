import { Router } from "express";
import { checkAuth, login, logout, signup } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const authRoute = Router();

authRoute.post("/signup", signup);
authRoute.post("/login", login);
authRoute.get("/check", authenticateToken, checkAuth);
authRoute.post("/logout", authenticateToken, logout);

export default authRoute;
