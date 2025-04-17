// src/components/CurrentJobDisplayWithProgressAndPause.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner, faCogs, faExclamationCircle, faBoxOpen,
    faRulerHorizontal, faCut, faCheckCircle, faPauseCircle, faFileAlt,
    faChartLine, faPause // Added faPause
} from '@fortawesome/free-solid-svg-icons';

// --- Constants ---
const DEVICE_ONLINE_THRESHOLD_SECONDS = 5;
const POLLING_INTERVAL_MS = 3000;

// --- Helper Sub-component for Detail Items ---
// Assuming DetailItem component is defined elsewhere or add its definition here
const DetailItem = React.memo(({ icon, label, value, unit, color = 'gray' }) => {
    // Basic implementation for context
    const colors = {
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500' },
        teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   icon: 'text-teal-500' },
        amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'text-amber-500' },
        gray:   { bg: 'bg-gray-100',  text: 'text-gray-600',   icon: 'text-gray-500' },
    };
    const selectedColor = colors[color] || colors.gray;
    const displayValue = value === null || value === undefined ? 'N/A' : typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
    return ( <div className={`flex items-center p-3 rounded-lg shadow-sm border border-gray-200/60 ${selectedColor.bg}`}> <FontAwesomeIcon icon={icon} className={`w-5 h-5 mr-3 flex-shrink-0 ${selectedColor.icon}`} /> <div className="min-w-0"> <div className="text-xs font-medium text-gray-500 capitalize">{label}</div> <div className={`text-sm font-semibold ${selectedColor.text} truncate`}>{displayValue} {(value !== null && value !== undefined && unit) && <span className="text-xs font-normal ml-0.5">{unit}</span>}</div> </div> </div> );
});


// --- Main Component ---
function CurrentJobDisplayWithProgressAndPause() {
    // --- State ---
    const [currentJob, setCurrentJob] = useState(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const [deviceIsOnline, setDeviceIsOnline] = useState(false); // Added state
    const [lastDeviceUpdate, setLastDeviceUpdate] = useState(null); // Added state for info
    const [status, setStatus] = useState('loading'); // Added 'paused' state possibility
    const [fetchError, setFetchError] = useState(null); // Combined errors
    const [isLoading, setIsLoading] = useState(true); // Strict initial loading

    // --- API Endpoints ---
    const API_STATUS_ENDPOINT = 'https://vps.sumitsaw.tech/api/mcp101/status/last'; // Added
    const API_TODO_ENDPOINT = 'https://vps.sumitsaw.tech/api/mcp101/toDo';
    const API_PROGRESS_ENDPOINT = 'https://vps.sumitsaw.tech/api/mcp101/progress';

    // --- Fetch Logic ---
    const fetchAllStatus = useCallback(async (isInitialFetch = false) => {
        if (isInitialFetch) {
            setIsLoading(true);
            setFetchError(null);
        }
        // Do NOT set isLoading=true on interval fetches

        let fetchedJobData = null;
        let fetchedProgress = 0;
        let fetchedDeviceOnline = false;
        let fetchedLastUpdate = null;
        let jobStatusOk = false;
        let currentErrors = [];
        let criticalErrorOccurred = false;

        // Read current state for comparison/fallback
        const localCurrentJob = currentJob;
        const localProgressPercent = progressPercent;

        try {
            const [statusRes, todoRes, progressRes] = await Promise.allSettled([
                fetch(API_STATUS_ENDPOINT, { headers: { 'accept': 'application/json' }, cache: 'no-store' }),
                fetch(API_TODO_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' }),
                fetch(API_PROGRESS_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' })
            ]);

            // 1. Process Device Status
            if (statusRes.status === 'fulfilled' && statusRes.value.ok) { try { const data = await statusRes.value.json(); if (data && typeof data.time === 'number') { const timeDiff = Math.floor(Date.now() / 1000) - Math.floor(data.time); fetchedDeviceOnline = timeDiff < DEVICE_ONLINE_THRESHOLD_SECONDS; fetchedLastUpdate = data.time * 1000; } else { currentErrors.push("Inv device status format."); } } catch (e) { currentErrors.push("Parse device status fail."); } } else { currentErrors.push(`Device API: ${statusRes.status === 'fulfilled' ? statusRes.value.statusText : statusRes.reason?.message || 'Unknown'}`); }

            // 2. Process Job Status
            if (todoRes.status === 'rejected') { throw new Error(`Network error (Job): ${todoRes.reason?.message || 'Unknown'}`); } // CRITICAL
            if (todoRes.value.ok) { try { const data = await todoRes.value.json(); if (data && data.jobid) { fetchedJobData = data; jobStatusOk = true; } else { currentErrors.push("Inv job data format."); } } catch (e) { currentErrors.push("Parse job JSON fail."); } } else if (todoRes.value.status !== 404) { currentErrors.push(`Job API: ${todoRes.value.statusText}`); }

            // 3. Process Progress
            if (jobStatusOk) {
                if (progressRes.status === 'fulfilled' && progressRes.value.ok) { try { const data = await progressRes.value.json(); if (data && typeof data.output === 'number') { let calc = Math.round(data.output * 100); fetchedProgress = Math.max(0, Math.min(100, calc)); } else { currentErrors.push("Inv progress format."); } } catch (e) { currentErrors.push("Parse progress fail."); } } else { currentErrors.push(`Progress API: ${progressRes.status === 'fulfilled' ? progressRes.value.statusText : progressRes.reason?.message || 'Unknown'}`); if (fetchedJobData?.jobid === localCurrentJob?.jobid) { fetchedProgress = localProgressPercent; } else { fetchedProgress = 0; } }
            } else { fetchedProgress = 0; }

            // --- Determine New Status (before setting state) ---
            let newCalculatedStatus;
            if (fetchedJobData) { // Job assigned
                newCalculatedStatus = fetchedDeviceOnline ? 'running' : 'paused';
            } else { // No job assigned
                newCalculatedStatus = 'idle';
            }

            // --- Conditional State Updates ---
            if (JSON.stringify(localCurrentJob) !== JSON.stringify(fetchedJobData)) { setCurrentJob(fetchedJobData); }
            if (fetchedProgress !== localProgressPercent) { setProgressPercent(fetchedProgress); }
            if (fetchedDeviceOnline !== deviceIsOnline) { setDeviceIsOnline(fetchedDeviceOnline); } // Update device online state
            if (fetchedLastUpdate !== lastDeviceUpdate) { setLastDeviceUpdate(fetchedLastUpdate); } // Update last update time
            if (newCalculatedStatus !== status) { setStatus(newCalculatedStatus); } // Update calculated status

            const newErrorString = currentErrors.length > 0 ? currentErrors.join('; ') : null;
            if (newErrorString !== fetchError) { setFetchError(newErrorString); }

        } catch (criticalError) {
            criticalErrorOccurred = true;
            console.error("Critical fetch error:", criticalError);
            // Set critical error and reset other states only if they differ
            if (fetchError !== criticalError.message) setFetchError(criticalError.message);
            if (currentJob !== null) setCurrentJob(null);
            if (progressPercent !== 0) setProgressPercent(0);
            if (deviceIsOnline !== false) setDeviceIsOnline(false);
            if (lastDeviceUpdate !== null) setLastDeviceUpdate(null);
            if (status !== 'error') setStatus('error'); // Set error status
        } finally {
            // Strict isLoading handling
            if (isInitialFetch) {
                setIsLoading(false);
            }
            // If a critical error occurred, ensure status is 'error'
            if (criticalErrorOccurred && status !== 'error') {
                setStatus('error');
            }
        }
        // Dependencies needed for comparison/fallback inside the function
    }, [currentJob, progressPercent, deviceIsOnline, lastDeviceUpdate, fetchError, status]);


    // --- Effect for Polling ---
    useEffect(() => {
        fetchAllStatus(true); // Initial fetch
        const intervalId = setInterval(() => fetchAllStatus(false), POLLING_INTERVAL_MS);
        return () => clearInterval(intervalId); // Cleanup interval
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount


    // --- Helper to get Status Badge ---
    const getStatusBadge = () => {
        switch (status) {
            case 'running': return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 shadow-sm border border-green-200" title={`Device online. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> In Progress</span> );
            case 'paused':  return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 shadow-sm border border-orange-200" title={`Device offline. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faPause} className="w-4 h-4" /> Paused</span> ); // Paused Badge
            case 'idle':    return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 shadow-sm border border-gray-200"><FontAwesomeIcon icon={faPauseCircle} className="w-4 h-4" /> Idle</span> );
            case 'error':   return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 shadow-sm border border-red-200" title={fetchError || 'An error occurred'}><FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4" /> Error</span> );
            case 'loading': return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 shadow-sm border border-blue-200"><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin"/> Loading...</span> );
            default: return null;
        }
    };

    // --- Render ---
    return (
        <div className="p-4">
            <div className="bg-gradient-to-br from-white/70 via-white/80 to-cyan-50/60 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/80 relative min-h-[120px]">

                {/* Loading Overlay - ONLY for initial load */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-md z-20 pointer-events-none">
                        <div className="text-center"> <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-cyan-500 animate-spin mb-3" /> <p className="text-gray-600 font-medium italic">Loading status...</p> </div>
                    </div>
                )}

                {/* Error Display - Only for critical errors AND not initial loading */}
                {!isLoading && status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 backdrop-blur-md z-10 p-4 text-center">
                        <FontAwesomeIcon icon={faExclamationCircle} className="w-10 h-10 text-red-500 mb-3" />
                        <p className="text-red-700 font-semibold text-lg">Status Update Error</p>
                        <p className="text-sm text-red-600 mt-1 max-w-md">{fetchError || 'An unknown error occurred.'}</p>
                        <button onClick={() => fetchAllStatus(true)} className="mt-4 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"> Retry </button>
                    </div>
                )}

                {/* Main Content Area - Render structure always after initial load */}
                {!isLoading && (
                    <div className={`p-5 transition-opacity duration-300 ${status === 'error' ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
                        {/* Header Row */}
                        <div className="p-5 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-y-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <FontAwesomeIcon icon={faCogs} className="w-6 h-6 text-cyan-600 flex-shrink-0" />
                                <h2 className="text-xl font-bold text-gray-800 tracking-tight truncate">
                                    {currentJob?.title || (status === 'idle' ? 'No Active Job' : status === 'loading' ? 'Loading...' : status === 'error' ? 'Error' : '')}
                                </h2>
                            </div>
                            <div className="flex-shrink-0">
                                {getStatusBadge()}
                            </div>
                        </div>

                        {/* Body - Details are always shown in this version, progress varies */}
                        <div className="p-5 space-y-5">
                            {/* Show Details OR Idle Message */}
                            {(status === 'running' || status === 'paused') && currentJob && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <DetailItem icon={faBoxOpen} label="Quantity" value={currentJob.a} unit="" color="indigo" />
                                        <DetailItem icon={faRulerHorizontal} label="Length" value={currentJob.b} unit="mm" color="teal" />
                                        <DetailItem icon={faCut} label="Stripping" value={currentJob.c} unit="mm" color="amber" />
                                    </div>
                                    {currentJob.description && (
                                        <div className="mt-4 p-3 bg-gray-50/80 rounded-lg border border-gray-200/70">
                                            <h4 className="flex items-center text-xs font-semibold text-gray-500 mb-1.5"><FontAwesomeIcon icon={faFileAlt} className="w-3.5 h-3.5 mr-1.5 text-gray-400"/> Description </h4>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentJob.description}</p>
                                        </div>
                                    )}

                                    {/* --- PROGRESS BAR SECTION --- */}
                                    <div className="pt-2">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5"><FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5"/> Progress
                                                {/* Show non-critical errors */}
                                                {fetchError && status !== 'error' && ( <FontAwesomeIcon icon={faExclamationCircle} className="w-3 h-3 text-orange-500 ml-1" title={`Warning: ${fetchError}`} /> )}
                                            </span>
                                            <span className="text-lg font-bold text-gray-800">{progressPercent}%</span>
                                        </div>
                                        {/* Progress bar track */}
                                        <div className={`w-full bg-gray-200/80 rounded-full h-3.5 overflow-hidden shadow-inner relative ${status === 'paused' ? 'opacity-70' : ''}`}>
                                            {/* Animated fill - style changes based on status */}
                                            <motion.div
                                                className={`absolute inset-0 h-full rounded-full ${status === 'paused' ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                                                initial={false}
                                                animate={{ width: `${progressPercent}%` }}
                                                transition={{ duration: 0.6, type: "spring", stiffness: 50, damping: 15 }}
                                            />
                                            {/* Track overlay */}
                                            <div className="absolute inset-0 h-full opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '40px 40px' }}></div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Message when Idle */}
                            {status === 'idle' && (
                                <div className="text-center py-6">
                                    <FontAwesomeIcon icon={faPauseCircle} className="w-12 h-12 text-gray-400 mb-3" />
                                    <p className="text-gray-500 font-medium">The machine is currently idle.</p>
                                    <p className="text-sm text-gray-400 mt-1">No job is currently assigned.</p>
                                </div>
                            )}

                            {/* Message if critical error but job data might still be shown briefly */}
                            {status === 'error' && currentJob && (
                                <p className="text-center text-sm text-red-600 italic mt-4"> There was an error updating the status. </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CurrentJobDisplayWithProgressAndPause; // Renamed export