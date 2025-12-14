// src/components/Navbar.tsx
import { Bot } from "lucide-react";
import React from "react";
import { useAuthStore } from "../store/useAuthStore";

const Navbar: React.FC = () => {
    const { authUser, logout } = useAuthStore();

    return (
        <div className="navbar bg-base-200 px-4 flex-none">
            <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2196f3] shadow-lg">
                    <Bot className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <a className="text-xl font-semibold">REPO AI</a>
            </div>
            {authUser && (
                <div className="flex-none">
                    <button
                        className="btn btn-error btn-sm"
                        onClick={() => logout()}
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default Navbar;
