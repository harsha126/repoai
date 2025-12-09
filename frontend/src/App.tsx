import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Route";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/NavBar";

function App() {
    return (
        <BrowserRouter>
            <Toaster />
            <Navbar/>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
