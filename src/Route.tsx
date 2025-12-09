import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";

const Dashboard = () => (
    <div className="p-10 text-2xl font-bold">
        Welcome to the Private Dashboard!
        <br />
        <span className="text-sm font-normal text-gray-500">
            (You are authenticated)
        </span>
    </div>
);

const useAuth = () => {
    const user = { loggedIn: false };
    return user && user.loggedIn;
};

const PrivateRoutes = () => {
    const isAuth = useAuth();
    return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

// --- Main Routes Component ---
const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<PrivateRoutes />}>
                <Route path="/" element={<Dashboard />} />
                {/* <Route path="/settings" element={<Settings />} /> */}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
