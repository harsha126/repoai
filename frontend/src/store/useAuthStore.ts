import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import type { SignUpFormValues } from "../Pages/SignUpPage";
import type { LoginFormValues } from "../Pages/LoginPage";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";

export interface IAuthUser {
    username: string;
    email: string;
}

export interface AuthState {
    authUser: IAuthUser | null;
    isSigningUp: boolean;
    isCheckingAuth: boolean;
    isLoggingIn: boolean;
    isLoggingOut: boolean;
    checkAuth: () => Promise<void>;
    signUp: (userData: SignUpFormValues) => Promise<void>;
    logout: () => Promise<void>;
    login: (credentials: LoginFormValues) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    authUser: null,
    isSigningUp: false,
    isCheckingAuth: false,
    isLoggingIn: false,
    isLoggingOut: false,
    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data, isCheckingAuth: false });
        } catch (error) {
            set({ authUser: null, isCheckingAuth: false });
            console.error("Error checking auth:", error);
        }
    },
    signUp: async (userData: SignUpFormValues) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", userData);
            toast.success("SignUp Sucessfull!");
            set({ authUser: res.data });
        } catch (error) {
            set({ authUser: null });
            const axiosError = error as AxiosError<{ message: string }>;
            set({ authUser: null });
            toast.error(
                axiosError.response?.data?.message || "Error Signing up"
            );
            console.error("Error signing up:", error);
        } finally {
            set({ isSigningUp: false });
        }
    },
    logout: async () => {
        set({ isLoggingOut: true });
        try {
            await axiosInstance.post("/auth/logout");
            toast.success("Logout Sucessfull!");
            set({ authUser: null });
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            set({ authUser: null });
            toast.error(
                axiosError.response?.data?.message || "Error logging out"
            );
            console.error("Error logging out:", error);
        } finally {
            set({ isLoggingOut: false });
        }
    },

    login: async (credentials) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", credentials);
            toast.success("Login successful!");
            set({ authUser: res.data });
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            set({ authUser: null });
            toast.error(
                axiosError.response?.data?.message || "Error logging in"
            );
            console.error("Error logging in:", error);
        } finally {
            set({ isLoggingIn: false });
        }
    },
}));
