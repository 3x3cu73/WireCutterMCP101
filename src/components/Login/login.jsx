import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

// Optional: Add an icon library like react-icons if you want input icons
// import { FiMail, FiLock } from 'react-icons/fi';

export default function Login({setToken,setLoggedIn}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    const handleLogin=async e=>{
        e.preventDefault();
        const url = `https://vps.sumitsaw.tech/api/mcp101/login`;
        const username=email
        const password_hash=password
        const response = await axios.post(url, {username,password_hash}, { // Sending 'task' directly
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                // Add Authorization header if needed
            },
        });
        const data=response.data;
        // const data = await response.json();
        console.log(response.data);
        if (response) {
            setToken(data.token); // Assuming the token is in data.token
            console.log("Login successful");
            setLoggedIn(true)
        } else {
            console.error("Login failed:", data.status);
        }
    }

    return (
        // Main container: Full screen, centered content, gradient background
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-blue-200 to-indigo-300 p-4">
            {/* Login Card: Centered, max-width, padding, background with transparency + blur, rounded, shadow */}
            <div className="w-full max-w-md p-8 space-y-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-800 text-center">
                    Automatic Wire Cutter {/* Updated Title */}
                </h2>
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    {/* Input Field Container (can add icons here if desired) */}
                    <div className="relative">
                        {/* Optional Icon:
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <FiMail />
                        </span> */}
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Email Address" // Placeholder text
                            className="block w-full px-4 py-3 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                            // Add pl-10 if using icon
                        />
                    </div>

                    {/* Input Field Container */}
                    <div className="relative">
                        {/* Optional Icon:
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <FiLock />
                        </span> */}
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Password" // Placeholder text
                            className="block w-full px-4 py-3 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                            // Add pl-10 if using icon
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                    >
                        Login
                    </button>
                </form>
                <p className="mt-6 text-sm text-center text-gray-600">
                    Don't have an account?{" "}
                    <Link className="font-medium text-blue-600 hover:text-blue-700 hover:underline" to="/register">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}