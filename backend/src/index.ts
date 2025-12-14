import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route";
import cookieParser from "cookie-parser";
import repoRouter from "./routes/repo.route";
import chatRouter from "./routes/chat.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRoute);
app.use("/api/repo", repoRouter);
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
