// src/components/BeautifulStatusDisplay.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const expandVariants = {
    collapsed: { height: 0, opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
    expanded: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
};

function BeautifulStatusDisplay() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [controllerStatus, setControllerStatus] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const fetchStatus = async () => {
        try {
            const response = await fetch('https://vps.sumitsaw.tech/api/mcp101/status/last', {
                headers: {
                    'accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(`Failed to fetch status: ${response.status} - ${errorData?.detail || 'Unknown error'}`);
                console.error("API Error:", errorData);
            } else {
                const data = await response.json();
                console.log("API Success:", data);
                setStatus(data);
            }
        } catch (err) {
            setError(`Failed to fetch status: ${err.message}`);
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
            console.log("Loading:", false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const intervalId = setInterval(fetchStatus, 2000); // Refresh every 2 seconds
        return () => clearInterval(intervalId); // Cleanup interval on unmount
    }, []);

    useEffect(() => {
        if (status && typeof status.time === 'number') {
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds (UTC)
            const lastUpdateTime = Math.floor(status.time); // Use the 'time' from the API directly
            const difference = currentTime - lastUpdateTime;

            if (difference < 5) {
                setControllerStatus('Online');
            } else {
                setControllerStatus('Offline');
            }
        } else {
            setControllerStatus('Loading...');
        }
    }, [status]);

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    if (loading) {
        return <div className="text-center text-gray-500 italic">Loading device status...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 font-semibold">Error: {error}</div>;
    }

    if (!status) {
        return <div className="text-center text-gray-500">No device status available.</div>;
    }

    const formattedTime = new Date(status.time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    const wifiMac = status.data?.find(item => item.label === 'WiFi MAC Address')?.info;
    const ipAddress = status.data?.find(item => item.label === 'IP Address')?.info;

    return (
        <div className="bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className={`bg-blue-500 py-4 px-6 flex items-center justify-between`}>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            Device Status
                            {controllerStatus === 'Online' && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-green-800 text-xs font-medium">Online</span>
                            )}
                            {controllerStatus === 'Offline' && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-red-800 text-xs font-medium">Offline</span>
                            )}
                            {controllerStatus === 'Loading...' && (
                                <span className="ml-2 text-white text-xs italic">Loading...</span>
                            )}
                        </h2>
                        <div className="mt-1 text-sm text-blue-100">
                            {wifiMac && <span>MAC: {wifiMac}</span>}
                            {ipAddress && <span className="ml-2">IP: {ipAddress}</span>}
                        </div>
                    </div>
                    <button onClick={toggleExpand} className="bg-blue-400 hover:bg-blue-300 text-white text-sm font-semibold py-2 px-3 rounded">
                        {expanded ? 'Collapse' : 'Expand'}
                    </button>
                </div>
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            className="p-4 sm:p-6"
                            variants={expandVariants}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {status?.data?.map(item => (
                                    <div key={item.label} className="bg-gray-50 rounded-md p-3 shadow-sm flex flex-col">
                                        <dt className="text-gray-700 font-semibold text-sm">{item.label}:</dt>
                                        <dd className="mt-1 text-gray-900 font-medium">{item.info}</dd>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="bg-gray-100 py-2 px-4 text-right text-xs italic text-gray-500">
                    Last API Update: {formattedTime} (IST)
                </div>
            </div>
        </div>
    );
}

export default BeautifulStatusDisplay;