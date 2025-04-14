import './App.css';
import { Dashboard } from "./pages/Dashboard.jsx";
import { Route, Routes } from "react-router-dom";
import Team from "./pages/Team.jsx";
import Login from "./components/Login/login.jsx";
import Register from "./components/Login/register.jsx";
import React, { useState, useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react"; // <--- Import SpeedInsights

function setToken(token) {
    sessionStorage.setItem("token", JSON.stringify(token));
}

function setLoggedInStorage(isLoggedIn) {
    sessionStorage.setItem("loggedIn", JSON.stringify(isLoggedIn));
}

function getLoggedInStorage() {
    const loggedInString = sessionStorage.getItem('loggedIn');
    return loggedInString ? JSON.parse(loggedInString) : false;
}

function App() {
    const [loggedIn, setLoggedIn] = useState(getLoggedInStorage());

    useEffect(() => {
        setLoggedInStorage(loggedIn);
    }, [loggedIn]);

    if (!loggedIn) {
        return (
            <div>
                {/* Routes for logged-out users */}
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login setToken={setToken} setLoggedIn={setLoggedIn} />} />
                    {/* Default route for logged-out users, often the login page */}
                    <Route path="/" element={<Login setToken={setToken} setLoggedIn={setLoggedIn} />} />
                    {/* You might want a catch-all or redirect here too */}
                    <Route path="*" element={<Login setToken={setToken} setLoggedIn={setLoggedIn} />} />
                </Routes>
                <SpeedInsights /> {/* <-- Add SpeedInsights here */}
            </div>
        );
    }

    // If logged in
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Main Application Routes for logged-in users */}
            <Routes>
                {/* Dashboard is the default and also handles /login attempt when logged in */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Dashboard />} /> {/* Redirect logged-in users from /login to Dashboard */}
                {/* Team Route */}
                <Route path="/Team" element={<Team />} />
                {/* Optional: Catch-all route for logged-in users, redirecting to Dashboard */}
                <Route path="*" element={<Dashboard />} />
            </Routes>
            <SpeedInsights /> {/* <-- Add SpeedInsights here */}
        </div>
    );
}

export default App;