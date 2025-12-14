import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Route";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/NavBar";

function App() {
    return (
        <BrowserRouter>
            <div className="h-screen flex flex-col">
                <Toaster />
                <Navbar />
                <AppRoutes />
            </div>
        </BrowserRouter>
    );
}

export default App;
