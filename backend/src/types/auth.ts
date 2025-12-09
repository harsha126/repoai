export interface User {
    id: string;
    name: string | null;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}
