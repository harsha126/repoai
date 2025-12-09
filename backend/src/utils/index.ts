import jwt from "jsonwebtoken";
import { User } from "../generated/prisma/client";
import { Response } from "express";

export const generateToken = (user: User, res: Response) => {
    const token = jwt.sign(
        { id: user.id, name: user.name },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
    );
    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    return token;
};
