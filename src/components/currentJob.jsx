// src/components/CurrentJobDisplay.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCheck,
    faSpinner, faCogs, faExclamationCircle, faBoxOpen, faRulerHorizontal,
    faCut, faCheckCircle, faPauseCircle, faFileAlt, faChartLine,
    faChevronDown, faChevronUp, faWifi, faPause, faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

// --- Animation Variants ---
const detailsVariants = {
    collapsed: { height: 0, opacity: 0, marginTop: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    expanded: { height: 'auto', opacity: 1, marginTop: '1.25rem', transition: { duration: 0.3, ease: "easeInOut" } },
};
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

// --- Constants ---
const DEVICE_ONLINE_THRESHOLD_SECONDS = 7;
const POLLING_INTERVAL_MS = 1000;
const API_BASE_URL = 'https://vps.sumitsaw.tech/api/mcp101';
const API_STATUS_ENDPOINT = `${API_BASE_URL}/status/last`;
const API_TODO_ENDPOINT = `${API_BASE_URL}/toDo`;
const API_PROGRESS_ENDPOINT = `${API_BASE_URL}/progress`;

// --- Helper Sub-component: Memoized DetailItem ---
const DetailItem = React.memo(({ icon, label, value, unit, color = 'gray' }) => {
    const colors = useMemo(() => ({
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-500' },
        teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   icon: 'text-teal-500' },
        amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'text-amber-500' },
        gray:   { bg: 'bg-gray-100',  text: 'text-gray-600',   icon: 'text-gray-500' },
    }), []);
    const selectedColor = colors[color] || colors.gray;
    const displayValue = value === null || value === undefined ? 'N/A' : typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;

    return (
        <div className={`flex items-center p-3 rounded-lg shadow-sm border border-gray-200/60 ${selectedColor.bg}`}>
            <FontAwesomeIcon icon={icon} className={`w-5 h-5 mr-3 flex-shrink-0 ${selectedColor.icon}`} />
            <div className="min-w-0">
                <div className="text-xs font-medium text-gray-500 capitalize">{label}</div>
                <div className={`text-sm font-semibold ${selectedColor.text} truncate`}>
                    {displayValue} {(value !== null && value !== undefined && unit) && <span className="text-xs font-normal ml-0.5">{unit}</span>}
                </div>
            </div>
        </div>
    );
});
DetailItem.displayName = 'DetailItem';

// --- Main Component ---
function CurrentJobDisplay() {
    // --- State ---
    const [currentJob, setCurrentJob] = useState(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const [deviceIsOnline, setDeviceIsOnline] = useState(false);
    const [lastDeviceUpdate, setLastDeviceUpdate] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Still true initially
    const [isExpanded, setIsExpanded] = useState(false);

    // Ref to track if it's the very first fetch attempt
    const isInitialFetchAttempt = useRef(true);
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);


    // --- Fetching Logic ---
    // No longer needs isInitialFetch parameter for loading state
    const fetchAllStatus = useCallback(async () => {
        if (!isMounted.current) return;

        // We don't set isLoading here anymore for polling/retry

        // Capture state *before* async calls
        const localCurrentJobId = currentJob?.jobid;
        const localProgressPercent = progressPercent;
        const localDeviceIsOnline = deviceIsOnline;
        const localFetchError = fetchError;
        const localLastDeviceUpdate = lastDeviceUpdate;

        let fetchedJobData = null;
        let fetchedProgress = 0;
        let fetchedDeviceOnline = false;
        let fetchedLastUpdate = null;
        let jobFetchOk = false;
        let jobDataFound = false;
        let progressFetchOk = false;
        let deviceStatusFetchOk = false;

        const errors = [];
        let criticalErrorOccurred = false;

        try {
            // Clear non-critical errors before each fetch attempt *after* the initial one
            // This prevents old non-critical errors from sticking around indefinitely
            if (!isInitialFetchAttempt.current && localFetchError && !(localFetchError.includes('Job Fetch Failed') || localFetchError.includes('Job API Error'))) {
                if(isMounted.current) setFetchError(null); // Clear only non-critical errors
            } else if (isInitialFetchAttempt.current) {
                if(isMounted.current) setFetchError(null); // Clear all errors on very first attempt
            }


            // --- Fetch all endpoints concurrently ---
            const results = await Promise.allSettled([
                fetch(API_STATUS_ENDPOINT, { headers: { 'accept': 'application/json' }, cache: 'no-store' }),
                fetch(API_TODO_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' }),
                fetch(API_PROGRESS_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' })
            ]);

            const [statusRes, todoRes, progressRes] = results;

            // --- Processing logic remains the same ---
            // --- 1. Process Device Status ---
            if (statusRes.status === 'fulfilled') {
                if (statusRes.value.ok) {
                    try {
                        const data = await statusRes.value.json();
                        if (data && typeof data.time === 'number') {
                            const nowSeconds = Math.floor(Date.now() / 1000);
                            const deviceTimeSeconds = Math.floor(data.time);
                            const timeDiff = nowSeconds - deviceTimeSeconds;
                            fetchedDeviceOnline = timeDiff >= 0 && timeDiff < DEVICE_ONLINE_THRESHOLD_SECONDS;
                            fetchedLastUpdate = deviceTimeSeconds * 1000;
                            deviceStatusFetchOk = true;
                        } else { errors.push("Invalid device status format."); }
                    } catch (e) { errors.push("Failed to parse device status JSON."); }
                } else { errors.push(`Device Status API Error: ${statusRes.value.status} ${statusRes.value.statusText}`); }
            } else { errors.push(`Device Status Fetch Failed: ${statusRes.reason?.message || 'Network Error'}`); }

            // --- 2. Process Job Status ---
            if (todoRes.status === 'rejected') {
                criticalErrorOccurred = true;
                throw new Error(`Job Fetch Failed: ${todoRes.reason?.message || 'Network Error'}`);
            }
            jobFetchOk = true;
            if (todoRes.value.ok) {
                try {
                    const data = await todoRes.value.json();
                    if (data && data.jobid) {
                        fetchedJobData = data;
                        jobDataFound = true;
                    } else { errors.push("Invalid job data format."); }
                } catch (e) { errors.push("Failed to parse job JSON."); }
            } else if (todoRes.value.status === 404) {
                jobDataFound = false;
            } else {
                criticalErrorOccurred = true;
                throw new Error(`Job API Error: ${todoRes.value.status} ${todoRes.value.statusText}`);
            }

            // --- 3. Process Progress ---
            if (jobDataFound) {
                if (progressRes.status === 'fulfilled') {
                    if (progressRes.value.ok) {
                        try {
                            const data = await progressRes.value.json();
                            if (data && typeof data.output === 'number' && isFinite(data.output)) {
                                let calc = Math.round(data.output * 100);
                                fetchedProgress = Math.max(0, Math.min(100, calc));
                                progressFetchOk = true;
                            } else { errors.push("Invalid progress format or value."); }
                        } catch (e) { errors.push("Failed to parse progress JSON."); }
                    } else { errors.push(`Progress API Error: ${progressRes.value.status} ${progressRes.value.statusText}`); }
                } else { errors.push(`Progress Fetch Failed: ${progressRes.reason?.message || 'Network Error'}`); }

                if (!progressFetchOk) {
                    if (fetchedJobData?.jobid === localCurrentJobId) {
                        fetchedProgress = localProgressPercent;
                        // Don't push "Using previous progress..." if we are auto-clearing errors anyway
                        // errors.push("Using previous progress due to fetch failure.");
                    } else {
                        fetchedProgress = 0;
                    }
                }
            } else {
                fetchedProgress = 0;
            }

            // --- Update State Conditionally (logic remains same) ---
            if (!isMounted.current) return;

            const jobIdentityChanged = fetchedJobData?.jobid !== localCurrentJobId;
            const progressChanged = fetchedProgress !== localProgressPercent;
            const onlineStatusChanged = fetchedDeviceOnline !== localDeviceIsOnline;
            const lastUpdateChanged = fetchedLastUpdate !== localLastDeviceUpdate;
            // Combine new errors with existing critical error if one exists
            const newErrorString = errors.length > 0 ? errors.join('; ') : null;
            const finalErrorString = criticalErrorOccurred
                ? (fetchError?.includes('Job Fetch Failed') || fetchError?.includes('Job API Error') ? fetchError : newErrorString) // Keep existing critical, else use new
                : newErrorString;
            const errorChanged = finalErrorString !== localFetchError;


            if (jobIdentityChanged) {
                setCurrentJob(fetchedJobData);
                setProgressPercent(fetchedProgress);
                if (isExpanded && !fetchedJobData) setIsExpanded(false);
            } else if (progressChanged) {
                setProgressPercent(fetchedProgress);
            }

            if (onlineStatusChanged) setDeviceIsOnline(fetchedDeviceOnline);
            if (lastUpdateChanged) setLastDeviceUpdate(fetchedLastUpdate);
            // Update error state only if it changed, respecting critical errors
            if (errorChanged && !criticalErrorOccurred) { // Only update non-critical if no critical occurred in *this* run
                setFetchError(finalErrorString);
            }


        } catch (error) {
            console.error("Critical fetch error:", error);
            if (!isMounted.current) return;

            criticalErrorOccurred = true;
            const errorMessage = error?.message || 'An unknown critical error occurred.';

            // Set critical error state
            if (errorMessage !== localFetchError) setFetchError(errorMessage);

            // Reset other states only if necessary
            if (currentJob !== null) setCurrentJob(null);
            if (progressPercent !== 0) setProgressPercent(0);
            if (deviceIsOnline !== false) setDeviceIsOnline(false);
            if (lastDeviceUpdate !== null) setLastDeviceUpdate(null);
            if (isExpanded !== false) setIsExpanded(false);

        } finally {
            // *** Key Change: Only set isLoading false on the *first* attempt ***
            if (isMounted.current && isInitialFetchAttempt.current) {
                setIsLoading(false);
                isInitialFetchAttempt.current = false; // Mark initial fetch as done
            }
            // Ensure critical error state persists if needed, even if caught in finally
            if (isMounted.current && criticalErrorOccurred && (!fetchError?.includes('Job Fetch Failed') && !fetchError?.includes('Job API Error'))) {
                const critMsg = fetchError || 'Critical error occurred during fetch.';
                setFetchError(critMsg);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded, currentJob?.jobid, progressPercent, deviceIsOnline, fetchError, lastDeviceUpdate]); // Dependencies remain

    // --- Derived Status Calculation ---
    const derivedStatus = useMemo(() => {
        // Loading state is now only true very briefly on initial mount
        if (isLoading) return 'loading';
        if (fetchError && (fetchError.includes('Job Fetch Failed') || fetchError.includes('Job API Error'))) {
            return 'error';
        }
        if (currentJob) {
            return deviceIsOnline ? 'running' : 'paused';
        }
        return 'idle';
    }, [isLoading, currentJob, deviceIsOnline, fetchError]);

    // --- Effect for Initial Fetch & Polling ---
    useEffect(() => {
        isMounted.current = true;
        isInitialFetchAttempt.current = true; // Ensure flag is true on mount
        // Don't set isLoading(true) here, it's the default state

        // Initial Fetch
        fetchAllStatus(); // Call without arguments

        // Polling
        const intervalId = setInterval(() => {
            fetchAllStatus(); // Call without arguments
        }, POLLING_INTERVAL_MS);

        return () => {
            isMounted.current = false;
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchAllStatus]); // fetchAllStatus is memoized

    // --- Effect to Auto-collapse on Idle or Critical Error ---
    useEffect(() => {
        if ((derivedStatus === 'idle' || derivedStatus === 'error') && isExpanded) {
            setIsExpanded(false);
        }
    }, [derivedStatus, isExpanded]);

    // --- Toggle Handler ---
    const toggleExpand = () => {
        if (currentJob) {
            setIsExpanded(prev => !prev);
        }
    };

    // --- Helper to get Status Badge ---
    const getStatusBadge = useMemo(() => {
        // Loading badge will now likely never be seen unless the first fetch is very slow
        switch (derivedStatus) {
            case 'running': return (
                <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 shadow-sm border border-green-200" title={`Device online. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}>
        {/* Conditional Icon based on progressPercent */}
                    {
                        progressPercent === 100 ? // Check if progress is 100
                            (
                                <FontAwesomeIcon
                                    icon={faCheck} // If 100, show check icon
                                    className="w-4 h-4 text-green-600" // Optional: Use a darker green for the checkmark
                                    aria-label="Completed" // Accessibility label
                                />
                            ) : // Otherwise (progress is not 100)
                            (
                                <FontAwesomeIcon
                                    icon={faSpinner} // If not 100, show spinner icon
                                    className="w-4 h-4 animate-spin text-blue-500" // Keep spinning, maybe use a blue color
                                    aria-label="In progress" // Accessibility label
                                />
                            )
                    }
                    {/* Text based on progressPercent (this part was already correct) */}
                    {progressPercent !== 100 ? 'Inprogress' : 'Completed'}
    </span>
            );
            case 'paused':  return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 shadow-sm border border-orange-200" title={`Device offline or unresponsive. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faPause} className="w-4 h-4" /> Paused</span> );
            case 'idle':    return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 shadow-sm border border-gray-200"><FontAwesomeIcon icon={faPauseCircle} className="w-4 h-4" /> Idle</span> );
            case 'error':   return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 shadow-sm border border-red-200" title={fetchError || 'An error occurred'}><FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4" /> Error</span> );
            case 'loading': return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 shadow-sm border border-blue-200"><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin"/> Loading...</span> );
            default: return null;
        }
    }, [derivedStatus, lastDeviceUpdate, fetchError]);

    // --- Determine if details section can be shown/expanded ---
    const canShowDetails = (derivedStatus === 'running' || derivedStatus === 'paused') && !!currentJob;

    // --- Render ---
    return (
        <div className="p-4 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-white/70 via-white/80 to-cyan-50/60 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/80 relative min-h-[120px]">

                {/* Loading Overlay - Only shown initially */}
                <AnimatePresence>
                    {isLoading && ( // isLoading is only true before the first fetch completes
                        <motion.div
                            key="loading-overlay"
                            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-md z-20 pointer-events-none"
                            variants={overlayVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }}>
                            <div className="text-center"> <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-cyan-500 animate-spin mb-3" /> <p className="text-gray-600 font-medium italic">Loading status...</p> </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Overlay (Only for critical errors) */}
                <AnimatePresence>
                    {/* Show error overlay if not loading AND derivedStatus is error */}
                    {!isLoading && derivedStatus === 'error' && (
                        <motion.div
                            key="error-overlay"
                            className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 backdrop-blur-md z-10 p-4 text-center"
                            variants={overlayVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }}>
                            <FontAwesomeIcon icon={faTimesCircle} className="w-10 h-10 text-red-500 mb-3" />
                            <p className="text-red-700 font-semibold text-lg">Status Update Failed</p>
                            <p className="text-sm text-red-600 mt-1 max-w-md">{fetchError || 'An unknown critical error occurred.'}</p>
                            {(fetchError?.includes('Fetch Failed') || fetchError?.includes('Network Error') || fetchError?.includes('API Error')) && (
                                <button
                                    onClick={() => fetchAllStatus()} // Call without args, won't trigger main loading overlay
                                    className="mt-4 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                                    Retry
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <div className={`p-5 transition-opacity duration-300 ${derivedStatus === 'error' ? 'opacity-50 blur-[1px] ' : 'opacity-100'}`}>
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FontAwesomeIcon icon={faCogs} className="w-6 h-6 text-cyan-600 flex-shrink-0" />
                            {/* Display placeholder text slightly differently if it's the initial load vs subsequent updates */}
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight truncate" title={currentJob?.title || ''}>
                                {currentJob?.title || (derivedStatus === 'idle' ? 'No Active Job' : isLoading ? 'Loading...' : derivedStatus === 'error' ? 'Update Failed' : 'Status Unavailable')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {getStatusBadge}
                            {canShowDetails && (
                                <button
                                    onClick={toggleExpand}
                                    className="inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100/60 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300"
                                    aria-expanded={isExpanded}
                                    aria-controls="job-details-content"
                                    title={isExpanded ? 'Hide Details' : 'Show Details'}>
                                    <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="w-4 h-4 ml-1.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar Section */}
                    {currentJob && (derivedStatus === 'running' || derivedStatus === 'paused') && (
                        <div className="mt-4">
                            <div className="flex justify-between items-end mb-1.5">
                                <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5"/> Progress
                                    {/* Non-critical error display */}
                                    {fetchError && derivedStatus !== 'error' && (
                                        <FontAwesomeIcon icon={faExclamationCircle} className="w-3.5 h-3.5 text-orange-500 ml-1" title={`Warning: ${fetchError}`} />
                                    )}
                                </span>
                                <span className="text-lg font-bold text-gray-800">{progressPercent}%</span>
                            </div>
                            <div className={`w-full bg-gray-200/80 rounded-full h-3.5 overflow-hidden shadow-inner relative ${derivedStatus === 'paused' ? 'opacity-70' : ''}`}>
                                <motion.div
                                    key={currentJob.jobid}
                                    className={`absolute inset-0 h-full rounded-full ${derivedStatus === 'paused' ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.6, type: "spring", stiffness: 50, damping: 15 }}
                                />
                                <div className="absolute inset-0 h-full opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '40px 40px' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Idle Message */}
                    {/* Show Idle only if not loading and status is idle */}
                    {derivedStatus === 'idle' && !isLoading && (
                        <div className="text-center pt-8 pb-4">
                            <FontAwesomeIcon icon={faPauseCircle} className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="text-gray-500 font-medium">The machine is currently idle.</p>
                            <p className="text-sm text-gray-400 mt-1">Waiting for the next job.</p>
                        </div>
                    )}

                    {/* Collapsible Details */}
                    <AnimatePresence initial={false}>
                        {isExpanded && canShowDetails && (
                            <motion.div
                                id="job-details-content"
                                key="details-content"
                                className="overflow-hidden"
                                variants={detailsVariants}
                                initial="collapsed"
                                animate="expanded"
                                exit="collapsed"
                            >
                                <div className="space-y-4 pt-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <DetailItem icon={faBoxOpen} label="Quantity" value={currentJob?.a} unit="" color="indigo" />
                                        <DetailItem icon={faRulerHorizontal} label="Length" value={currentJob?.b} unit="mm" color="teal" />
                                        <DetailItem icon={faCut} label="Stripping" value={currentJob?.c} unit="mm" color="amber" />
                                    </div>
                                    {currentJob?.description && (
                                        <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200/70">
                                            <h4 className="flex items-center text-xs font-semibold text-gray-500 mb-1.5">
                                                <FontAwesomeIcon icon={faFileAlt} className="w-3.5 h-3.5 mr-1.5 text-gray-400"/> Description
                                            </h4>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{currentJob.description}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}

export default CurrentJobDisplay;
