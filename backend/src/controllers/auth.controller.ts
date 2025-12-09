import express, { Request, Response } from "express";

export const signup = (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
            });
        }
        const user = {};
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
    } catch (e) {
        console.error("Error in signup:", e);
        res.status(500).json({ message: "Internal Server error" });
    }
};
