import { AuthUser } from "./types/auth"; // your custom type (optional)

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export {};
