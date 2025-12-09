import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Route";
import { Toaster } from "react-hot-toast";

function App() {
    return (
        <BrowserRouter>
            <Toaster />
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
