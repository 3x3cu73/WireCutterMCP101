import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post(
                'https://vps.sumitsaw.tech/api/mcp101/register',
                {
                    ...formData,
                    password_hash: formData.password,
                    role: 'user',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                }
            );

            console.log('Registration successful:', response.data); // Log success
            if (response.status === 200 || response.status === 201) {
                toast.success('Registration successful!'); // Success toast
                setTimeout(() => {  // Redirect after a short delay
                    navigate('/login');
                }, 2000); // 2 seconds
            }


        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.message || 'Registration failed.', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 via-blue-200 to-indigo-300 p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-800 text-center">Create Account</h2>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {Object.keys(formData).map((key) => (
                        <div key={key} className="relative">
                            <input
                                type={key === 'password' ? 'password' : 'text'}
                                id={key}
                                name={key}
                                value={formData[key]}
                                onChange={handleChange}
                                required
                                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                                className="block w-full px-4 py-3 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`inline-flex justify-center items-center rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100/50 ${
                            isLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    {/* ... spinner SVG */}
                                </svg>
                                Registering...
                            </>
                        ) : (
                            'Register'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        to="/login"
                    >
                        Login
                    </Link>
                </p>
            </div>
            <ToastContainer />
        </div>
    );
}