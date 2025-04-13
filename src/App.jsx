import './App.css';
import { Dashboard } from "./pages/Dashboard.jsx";
import { Route, Routes, useNavigate } from "react-router-dom";
import Team from "./pages/Team.jsx";
import Login from "./components/Login/login.jsx";
import Register from "./components/Login/register.jsx";
import React, { useState, useEffect } from "react";

function setToken(token) {
    sessionStorage.setItem("token", JSON.stringify(token));
}

function getToken() {
    const tokenString = sessionStorage.getItem('token');
    const userToken = JSON.parse(tokenString);
    return userToken?.token;
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
    const navigate = useNavigate(); // Import and use useNavigate for navigation

    useEffect(() => {
        setLoggedInStorage(loggedIn);
        if (loggedIn) {
            // Optionally navigate to the dashboard if already logged in on mount
            // This prevents the login page from briefly showing on refresh if the user is logged in
            navigate('/');
        }
    }, [loggedIn, navigate]);

    if (!loggedIn) {
        return <Login setToken={setToken} setLoggedIn={setLoggedIn} />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Main Application Routes */}
            <Routes>
                {/* Dashboard Route */}
                <Route path="/" element={<Dashboard />} />

                {/* Team Route */}
                <Route path="/Team" element={<Team />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </div>
    );
}

export default App;