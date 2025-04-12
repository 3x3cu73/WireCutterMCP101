// src/components/BeautifulStatusDisplay.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Import necessary FontAwesome icons (as per previous correction)
import {
    faChevronUp, faChevronDown, faWifi, faGlobe, faClock, faMicrochip,
    faMemory, faTemperatureHalf, faNetworkWired, faMobileScreenButton,
    faWrench, faCircleInfo, faBolt, faSignal, faCloud
} from '@fortawesome/free-solid-svg-icons';

// --- Helper Function for FontAwesome Icon Mapping (Keep as before) ---
const getFaIconForLabel = (label) => {
    if (!label) return faCircleInfo;
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('time') || lowerLabel.includes('uptime')) return faClock;
    if (lowerLabel.includes('cpu') || lowerLabel.includes('core') || lowerLabel.includes('mcu')) return faMicrochip;
    if (lowerLabel.includes('memory') || lowerLabel.includes('storage') || lowerLabel.includes('heap')) return faMemory;
    if (lowerLabel.includes('temp')) return faTemperatureHalf;
    if (lowerLabel.includes('wifi') || lowerLabel.includes('ssid')) return faWifi;
    if (lowerLabel.includes('rssi')) return faSignal;
    if (lowerLabel.includes('ip address')) return faGlobe;
    if (lowerLabel.includes('mac address')) return faNetworkWired;
    if (lowerLabel.includes('device') || lowerLabel.includes('model')) return faMobileScreenButton;
    if (lowerLabel.includes('mode') || lowerLabel.includes('setting')) return faWrench;
    if (lowerLabel.includes('power') || lowerLabel.includes('voltage')) return faBolt;
    if (lowerLabel.includes('signal') && !lowerLabel.includes('rssi')) return faSignal;
    if (lowerLabel.includes('cloud')) return faCloud;
    return faCircleInfo;
};
// --- End Helper Function ---

// --- Animation Variants ---
const expandVariants = {
    collapsed: { height: 0, opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeOut' } },
    expanded: { height: 'auto', opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

// --- Main Component ---
function BeautifulStatusDisplay() {
    // State Variables
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [controllerStatus, setControllerStatus] = useState('Loading...'); // Start with loading text
    const [expanded, setExpanded] = useState(false);
    // ---- MODIFIED: Use initialLoading state ----
    const [initialLoading, setInitialLoading] = useState(true);

    // --- Fetch Logic ---
    const fetchStatus = async (isInitialFetch = false) => {
        // Don't set loading true for background interval fetches
        if (isInitialFetch) {
            // setError(null); // Reset error only on initial fetch attempt? Or keep existing? User preference.
        }

        try {
            const response = await fetch('https://vps.sumitsaw.tech/api/mcp101/status/last', {
                headers: { 'accept': 'application/json' },
                cache: 'no-store',

            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorDetail = 'Unknown server error';
                try { errorDetail = JSON.parse(errorText)?.detail || errorText; }
                catch { errorDetail = errorText || `HTTP error ${response.status}`; }
                setError(`Failed: ${errorDetail}`); // Set error state
                // Status derived in useEffect
            } else {
                const data = await response.json();
                setStatus(data);
                setError(null); // Clear error on success
                // Status derived in useEffect
            }
        } catch (err) {
            setError(`Network error: ${err.message}`); // Set error state
            // Status derived in useEffect
        } finally {
            // ---- MODIFIED: Only update initialLoading state ----
            if (isInitialFetch) {
                setInitialLoading(false); // Mark initial load attempt as complete
            }
        }
    };

    // --- Effects ---
    // Effect for Initial Fetch and Interval Setup
    useEffect(() => {
        let intervalId;
        const fetchDataAndSetInterval = async () => {
            await fetchStatus(true); // Pass true for initial fetch
            intervalId = setInterval(() => fetchStatus(false), 500); // Pass false for interval
        };
        fetchDataAndSetInterval();
        return () => { if (intervalId) clearInterval(intervalId); }; // Cleanup
    }, []); // Runs once on mount

    // Effect to Derive Controller Status and Manage Overlay Visibility
    useEffect(() => {
        // Don't try to derive status until initial load attempt is finished
        if (initialLoading) {
            setControllerStatus('Loading...');
            return; // Exit early, overlay handled by initialLoading
        }

        // If there's an error, prioritize showing Offline/Error
        if (error) {
            setControllerStatus('Offline');
            return; // Exit early, overlay handled by error state
        }

        // If no error and we have status data with time
        if (status?.time) {
            const timeDiff = Math.floor(Date.now() / 1000) - Math.floor(status.time);
            const isOnline = timeDiff < 4; // Check if device is considered online
            setControllerStatus(isOnline ? 'Online' : 'Offline');
        }
        // If no error, not loading initially, but still no status.time -> Treat as Offline/Unknown
        else {
            setControllerStatus('Offline');
        }

    }, [status, error, initialLoading]); // Depend on these states

    // --- Event Handlers ---
    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    // --- Derived Data ---
    const formattedTime = status?.time
        ? new Date(status.time * 1000).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
        })
        : 'N/A';
    const wifiMac = status?.data?.find(item => item.label === 'WiFi MAC Address')?.info;
    const ipAddress = status?.data?.find(item => item.label === 'IP Address')?.info;

    // --- Calculate showOverlay based on final states ---
    // Show overlay if: initial load is happening OR (initial load is done AND there's an error)
    const showOverlay = initialLoading || (!initialLoading && !!error);


    // --- Render ---
    return (
        <div className="p-4 relative">
            {/* Loading/Error Overlay */}
            <AnimatePresence>
                {/* ---- MODIFIED: Condition uses calculated showOverlay ---- */}
                {showOverlay && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10 m-4 rounded-2xl pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Show loading text ONLY during initial load */}
                        {initialLoading && <div className="text-center text-gray-600 font-medium italic">Loading device status...</div>}
                        {/* Show error text ONLY if not initial loading AND error exists */}
                        {!initialLoading && error && (
                            <div className="text-center text-red-600 font-semibold max-w-xs px-4">{error}</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Status Card */}
            {/* ---- MODIFIED: Add visibility style based on initialLoading ---- */}
            <div className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-gray-200/80 transition-opacity duration-300 ${initialLoading ? 'opacity-0' : 'opacity-100'}`}>
                {/* Header */}
                <div className={`py-4 px-5 flex flex-wrap items-center justify-between gap-y-2 border-b border-gray-200/80`}>
                    {/* Left Info */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 tracking-tight flex items-center">
                            Device Status
                            {/* Status Pills */}
                            {/* Render pills based on controllerStatus, but only if not initial loading */}
                            {!initialLoading && controllerStatus === 'Online' && (
                                <span className="ml-2.5 inline-flex items-center gap-x-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                                </span>
                            )}
                            {!initialLoading && controllerStatus === 'Offline' && (
                                <span className="ml-2.5 inline-flex items-center gap-x-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Offline
                                </span>
                            )}
                            {/* Keep loading text if needed, or rely on overlay */}
                            {/* {initialLoading && ( <span className="ml-2.5 text-gray-500 text-xs italic">Checking...</span> )} */}
                        </h2>
                        {/* Sub-info (MAC/IP) */}
                        <div className="mt-1.5 text-xs text-gray-500 flex items-center flex-wrap gap-x-3 gap-y-1">
                            {wifiMac && ( <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faWifi} className="w-3 h-3 text-gray-400" /> MAC: {wifiMac}</span> )}
                            {ipAddress && ( <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faGlobe} className="w-3 h-3 text-gray-400" /> IP: {ipAddress}</span> )}
                        </div>
                    </div>
                    {/* Expand Button */}
                    <button
                        onClick={toggleExpand}
                        // ---- MODIFIED: Disable logic ----
                        disabled={initialLoading || !!error || !status?.data } // Disable if initial loading, error exists, or no status data
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100/80 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ zIndex: 20 }}
                    >
                        {expanded ? 'Collapse' : 'Details'}
                        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="w-3 h-3" />
                    </button>
                </div>

                {/* Expandable Details Area */}
                <AnimatePresence initial={false}>
                    {expanded && status?.data && !initialLoading && !error && ( // Only show if expanded AND not initial loading AND no error
                        <motion.div
                            key="content"
                            className="px-5 pt-4 pb-5"
                            variants={expandVariants}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {status.data.map(item => {
                                    const faIcon = getFaIconForLabel(item.label);
                                    return (
                                        <div key={item.label} className="bg-white/60 rounded-lg p-3.5 shadow-sm border border-gray-200/60 flex flex-col justify-between min-h-[60px]">
                                            <dt className="flex items-center text-gray-600 font-medium text-xs mb-1">
                                                {faIcon && <FontAwesomeIcon icon={faIcon} className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" aria-hidden="true" fixedWidth />}
                                                <span className="truncate">{item.label}:</span>
                                            </dt>
                                            <dd className="text-gray-900 font-semibold text-sm break-words">{item.info ?? 'N/A'}</dd>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Timestamp */}
                <div className="bg-gray-50/50 py-2 px-5 text-right text-xs italic text-gray-500 border-t border-gray-200/80">
                    Last Update: {formattedTime} (IST)
                </div>
            </div>
        </div>
    );
}

export default BeautifulStatusDisplay;