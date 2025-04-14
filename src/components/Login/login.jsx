import React, { useState} from "react";
import { Link,Navigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Optional: Add an icon library like react-icons if you want input icons
// import { FiMail, FiLock } from 'react-icons/fi';

export default function Login({setToken,setLoggedIn}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading]=useState(false);


    const handleLogin=async e=>{
        setIsLoading(true)
        e.preventDefault();
        const url = `https://vps.sumitsaw.tech/api/mcp101/login`;
        const username=email
        const password_hash=password
        try {
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
        setIsLoading(false)
        if (response) {
            setToken(data.token); // Assuming the token is in data.token
            console.log("Login successful");
            setLoggedIn(true)


        } else {

            console.error("Login failed:", data.status);

        }
        }
    catch(error) {
        toast.error(error.response?.data?.message || 'Login failed.', {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
        setIsLoading(false)
            console.log(error)

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
                            type="text"
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
                        disabled={isLoading}
                        className={`inline-flex justify-center items-center rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100/50 ${
                            isLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                    >
                        {isLoading ? ( /* Loading indicator */
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Loging In...
                            </>
                        ) : ( 'Login' ) }
                    </button>
                </form>
                <p className="mt-6 text-sm text-center text-gray-600">
                    Don't have an account?{" "}
                    <Link className="font-medium text-blue-600 hover:text-blue-700 hover:underline" to="/register">
                        Sign up
                    </Link>
                </p>
            </div>

            <ToastContainer className="m-3"/>
        </div>
    );
}