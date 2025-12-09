import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthUser } from "../types/auth";
import { prisma } from "../prisma";

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.token;
        if (!token)
            return res.status(401).send({ message: "No token provided" });

        const secret = process.env.JWT_SECRET;
        if (!secret)
            return res
                .status(500)
                .send({ message: "JWT_SECRET is not configured" });

        const user = jwt.verify(token, secret) as AuthUser;

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        });
        if (!dbUser) return res.status(404).send({ message: "User not found" });

        req.user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
        };
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
    }
};
