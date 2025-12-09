import { Request, Response } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";

export const signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
            });
        }
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return res.status(201).json({
            name: name,
            email: email,
            id: newUser.id,
        });
    } catch (e) {
        console.error("Error in signup:", e);
        res.status(500).json({ message: "Internal Server error" });
    }
};
