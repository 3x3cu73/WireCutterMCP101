import './App.css';
import { Dashboard } from "./pages/Dashboard.jsx";
import { Route, Routes } from "react-router-dom";
import Team from "./pages/Team.jsx";
import Login from "./components/Login/login.jsx";
import Register from "./components/Login/register.jsx";
import React, { useState, useEffect } from "react";
import { SpeedInsights } from '@vercel/speed-insights/react';


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
            <div><Routes>

            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login setToken={setToken} setLoggedIn={setLoggedIn} />} />
            <Route path="/" element={<Login setToken={setToken} setLoggedIn={setLoggedIn} />} />

        </Routes>
            </div>);
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Main Application Routes */}
            <Routes>


                {/* Dashboard Route */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Dashboard />} />
                {/* Team Route */}
                <Route path="/Team" element={<Team />} />
                <SpeedInsights />
            </Routes>

        </div>
    );
}

export default App;