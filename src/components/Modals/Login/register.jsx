import React, { useState } from "react";
import { Link } from "react-router-dom";

// Optional: Add an icon library like react-icons if you want input icons
// import { FiUser, FiMail, FiLock } from 'react-icons/fi';

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add registration logic here
        console.log("Name:", name, "Email:", email, "Password:", password);
        // Example: You would typically call an API here
        // registerUser({ name, email, password });
    };

    return (
        // Main container: Full screen, centered content, gradient background
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-blue-200 to-indigo-300 p-4">
            {/* Register Card: Centered, max-width, padding, background with transparency + blur, rounded, shadow */}
            <div className="w-full max-w-md p-8 space-y-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-800 text-center">
                    Create Account {/* Updated Title */}
                </h2>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {/* Input Field Container (Name) */}
                    <div className="relative">
                        {/* Optional Icon:
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <FiUser />
                        </span> */}
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Full Name" // Placeholder text
                            className="block w-full px-4 py-3 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                            // Add pl-10 if using icon
                        />
                    </div>

                    {/* Input Field Container (Email) */}
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

                    {/* Input Field Container (Password) */}
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
                        Register {/* Updated Button Text */}
                    </button>
                </form>
                <p className="mt-6 text-sm text-center text-gray-600">
                    Already have an account?{" "}
                    <Link className="font-medium text-blue-600 hover:text-blue-700 hover:underline" to="/login"> {/* Link to Login */}
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}