// src/pages/LoginPage.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export type LoginFormValues = {
    username: string;
    password: string;
};

const LoginPage: React.FC = () => {
    const { login, isLoggingIn } = useAuthStore();
    const { register, handleSubmit } = useForm<LoginFormValues>({
        defaultValues: {
            username: "admin",
            password: "",
        },
    });

    const onSubmit = (data: LoginFormValues) => {
        login(data);
    };

    return (
        <div className="min-h-screen bg-[#22272f] text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#2196f3] shadow-lg">
                    <Bot className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>

                <h1 className="text-3xl font-semibold tracking-wide">
                    REPO AI
                </h1>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-72 space-y-3"
                    autoComplete="off"
                >
                    <input
                        type="text"
                        className="input input-bordered w-full h-9 bg-[#e6ebf3] border-none text-black text-sm rounded-[2px] focus:outline-none focus:ring-2 focus:ring-[#2196f3]"
                        {...register("username", { required: true })}
                        placeholder="Username"
                    />

                    <input
                        type="password"
                        className="input input-bordered w-full h-9 bg-[#e6ebf3] border-none text-black text-sm rounded-[2px] focus:outline-none focus:ring-2 focus:ring-[#2196f3]"
                        {...register("password", { required: true })}
                        placeholder="Password"
                    />

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="btn w-full h-9 min-h-0 normal-case bg-[#2196f3] hover:bg-[#1d87e0] border-none rounded-[2px] text-sm font-normal shadow-md"
                    >
                        Login
                    </button>
                    <div className="mt-1 mx-auto text-center">
                        <Link
                            to="/signup"
                            className="text-[#2196f3] hover:underline text-sm"
                        >
                            Create an account
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
