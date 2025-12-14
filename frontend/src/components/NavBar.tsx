// src/components/Navbar.tsx
import { Bot, Palette } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

const themes = [
    "light",
    "dark",
    "cupcake",
    "bumblebee",
    "emerald",
    "corporate",
    "synthwave",
    "retro",
    "cyberpunk",
    "valentine",
    "halloween",
    "garden",
    "forest",
    "aqua",
    "lofi",
    "pastel",
    "fantasy",
    "wireframe",
    "black",
    "luxury",
    "dracula",
    "cmyk",
    "autumn",
    "business",
    "acid",
    "lemonade",
    "night",
    "coffee",
    "winter",
];

const Navbar: React.FC = () => {
    const { authUser, logout } = useAuthStore();
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "light"
    );

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <div className="navbar bg-base-200 px-4 flex-none border-b border-base-content/10">
            <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary shadow-lg">
                    <Bot
                        className="w-5 h-5 text-primary-content"
                        strokeWidth={2.5}
                    />
                </div>
                <a className="text-xl font-semibold">REPO AI</a>
            </div>

            <div className="flex-none gap-2">
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost">
                        <Palette className="w-5 h-5" />
                        <span className="hidden md:inline">Theme</span>
                    </div>
                    <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 h-96 overflow-y-auto"
                    >
                        {themes.map((t) => (
                            <li key={t}>
                                <button
                                    className={`${theme === t ? "active" : ""}`}
                                    onClick={() => setTheme(t)}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {authUser && (
                    <button
                        className="btn btn-error btn-sm"
                        onClick={() => logout()}
                    >
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
};

export default Navbar;
