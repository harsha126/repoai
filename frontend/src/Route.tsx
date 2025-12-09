import React, { useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import SignUpPage from "./Pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { Loader } from "lucide-react";

const Dashboard = () => (
    <div className="p-10 text-2xl font-bold">
        Welcome to the Private Dashboard!
        <br />
        <span className="text-sm font-normal text-gray-500">
            (You are authenticated)
        </span>
    </div>
);

const PrivateRoutes = () => {
    const { authUser } = useAuthStore();
    return authUser ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoutes = () => {
    const { authUser } = useAuthStore();
    return !authUser ? <Outlet /> : <Navigate to="/" replace />;
};

const AppRoutes: React.FC = () => {
    const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isCheckingAuth && !authUser) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin size-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Routes>
                <Route element={<PublicRoutes />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                </Route>

                <Route element={<PrivateRoutes />}>
                    <Route path="/" element={<Dashboard />} />
                    {/* <Route path="/settings" element={<Settings />} /> */}
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

export default AppRoutes;
