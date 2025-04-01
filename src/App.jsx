import './App.css';
import { Dashboard } from "./pages/Dashboard.jsx";
import { Route, Routes } from "react-router-dom";
import Team from "./pages/Team.jsx";

function App() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Main Application Routes */}
            <Routes>
                {/* Dashboard Route */}
                <Route path="/" element={<Dashboard />} />

                {/* Team Route */}
                <Route path="/Team" element={<Team />} />
            </Routes>
        </div>
    );
}

export default App;
