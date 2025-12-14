import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route";
import cookieParser from "cookie-parser";
import repoRouter from "./routes/repo.route";
import chatRouter from "./routes/chat.route";
import { Server } from "socket.io";
import http from "http";
import { subscriberConnection } from "./queueConfig";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});

// Redis Subscriber for Worker Events

subscriberConnection.subscribe("job-updates", (err) => {
    if (err) {
        console.error("Failed to subscribe to job-updates channel:", err);
    } else {
        console.log("Subscribed to job-updates channel");
    }
});

subscriberConnection.on("message", (channel, message) => {
    if (channel === "job-updates") {
        try {
            const data = JSON.parse(message);
            io.emit("job-progress", data);
        } catch (e) {
            console.error("Error parsing redis message:", e);
        }
    }
});

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

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

httpServer.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
