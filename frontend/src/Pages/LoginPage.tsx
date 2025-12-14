// src/pages/LoginPage.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export type LoginFormValues = {
    email: string;
    password: string;
};

const LoginPage: React.FC = () => {
    const { login, isLoggingIn } = useAuthStore();
    const [showPassword, setShowPassword] = React.useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        defaultValues: {
            email: "",
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
                        className={`input w-full h-9 bg-[#e6ebf3] border-none text-black text-sm rounded-[2px] 
                                ${
                                    errors.email
                                        ? "ring-2 ring-red-500"
                                        : "focus:ring-2 focus:ring-[#2196f3]"
                                }`}
                        {...register("email", {
                            required: "Username is required",
                        })}
                        placeholder="Email"
                    />

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`input w-full h-9 bg-[#e6ebf3] border-none text-black text-sm rounded-[2px] pr-9
                            ${
                                errors.password
                                    ? "ring-2 ring-red-500"
                                    : "focus:ring-2 focus:ring-[#2196f3]"
                            }`}
                            {...register("password", {
                                required: "Password is required",
                            })}
                            placeholder="Password"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 z-20"
                        >
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>

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
