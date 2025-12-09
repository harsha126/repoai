// src/pages/SignUpPage.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export type SignUpFormValues = {
    email: string;
    password: string;
    name: string;
};

const SignUpPage: React.FC = () => {
    const { signUp, isSigningUp } = useAuthStore();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignUpFormValues>({
        defaultValues: {
            email: "",
            password: "",
            name: "",
        },
    });

    const onSubmit = (data: SignUpFormValues) => {
        signUp(data);
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

                    <input
                        type="text"
                        className={`input w-full h-9 bg-[#e6ebf3] border-none text-black text-sm rounded-[2px] 
                                ${
                                    errors.name
                                        ? "ring-2 ring-red-500"
                                        : "focus:ring-2 focus:ring-[#2196f3]"
                                }`}
                        {...register("name", {
                            required: "name is required",
                        })}
                        placeholder="Full Name"
                    />

                    <input
                        type="password"
                        className="input input-bordered w-full h-9 bg-[#e6ebf3] border-none text-black text-sm rounded-[2px] focus:outline-none focus:ring-2 focus:ring-[#2196f3]"
                        {...register("password", { required: true })}
                        placeholder="Password"
                    />

                    <button
                        type="submit"
                        disabled={isSigningUp}
                        className="btn w-full h-9 min-h-0 normal-case bg-[#2196f3] hover:bg-[#1d87e0] border-none rounded-[2px] text-sm font-normal shadow-md"
                    >
                        Register
                    </button>
                    <div className="mt-1 mx-auto text-center">
                        <Link
                            to="/login"
                            className="text-[#2196f3] hover:underline text-sm"
                        >
                            Already hava an account? Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
