// src/components/CurrentJobDisplay.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
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
    const [fetchError, setFetchError] = useState(null); // Consolidated error state
    const [isLoading, setIsLoading] = useState(true); // Still true initially
    const [isExpanded, setIsExpanded] = useState(false);

    // Refs
    const isInitialFetchAttempt = useRef(true);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);


    // --- Fetching Logic ---
    const fetchAllStatus = useCallback(async () => {
        if (!isMounted.current) return;

        // Capture *current* job ID and progress for comparison
        const localCurrentJobId = currentJob?.jobid;
        const localProgressPercent = progressPercent;

        let fetchedJobData = null;
        let fetchedProgress = 0; // Default to 0, update if progress fetched
        let fetchedDeviceOnline = false;
        let fetchedLastUpdate = null;

        const nonCriticalErrors = []; // Collect non-critical issues

        // Clear previous error state before the fetch attempt
        // This allows the component to retry showing data if the error was transient
        if (isMounted.current) setFetchError(null);

        try {
            // --- Fetch all endpoints concurrently ---
            const results = await Promise.allSettled([
                fetch(API_STATUS_ENDPOINT, { headers: { 'accept': 'application/json' }, cache: 'no-store' }),
                fetch(API_TODO_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' }),
                fetch(API_PROGRESS_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' })
            ]);

            const [statusRes, todoRes, progressRes] = results;

            // --- 1. Process Device Status ---
            if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
                try {
                    const data = await statusRes.value.json();
                    if (data && typeof data.time === 'number') {
                        const nowSeconds = Math.floor(Date.now() / 1000);
                        const deviceTimeSeconds = Math.floor(data.time);
                        const timeDiff = nowSeconds - deviceTimeSeconds;
                        fetchedDeviceOnline = timeDiff >= 0 && timeDiff < DEVICE_ONLINE_THRESHOLD_SECONDS;
                        fetchedLastUpdate = deviceTimeSeconds * 1000;
                    } else { nonCriticalErrors.push("Invalid device status format."); }
                } catch (e) { nonCriticalErrors.push("Failed to parse device status JSON."); }
            } else {
                // Treat device status fetch failure/error as non-critical for job display
                const errorDetail = statusRes.status === 'rejected' ? (statusRes.reason?.message || 'Network Error') : `${statusRes.value.status} ${statusRes.value.statusText}`;
                nonCriticalErrors.push(`Device Status Error: ${errorDetail}`);
            }


            // --- 2. Process Job Status (toDo endpoint) ---
            // This is the most critical fetch - if it fails, we have no job info.
            let jobFetchSuccessButNoJob = false; // Flag for 404 or empty array response
            if (todoRes.status === 'fulfilled') {
                if (todoRes.value.ok) {
                    try {
                        const data = await todoRes.value.json();
                        // Check if data is an array and has at least one item with jobid
                        if (Array.isArray(data) && data.length > 0 && data[0]?.jobid) {
                            fetchedJobData = data[0]; // Assuming the first item is the current job
                        } else {
                            // API returned OK but no job data (e.g., empty array)
                            jobFetchSuccessButNoJob = true;
                        }
                    } catch (e) {
                        // JSON parsing failed for todo endpoint - this IS critical
                        throw new Error(`Failed to parse Job JSON: ${e.message}`);
                    }
                } else if (todoRes.value.status === 404) {
                    // API returned 404, explicitly stating no job
                    jobFetchSuccessButNoJob = true;
                } else {
                    // Any other non-OK status from todo endpoint is a critical error
                    throw new Error(`Job API Error: ${todoRes.value.status} ${todoRes.value.statusText}`);
                }
            } else {
                // todo endpoint request failed (network error etc) - this IS critical
                throw new Error(`Job Fetch Failed: ${todoRes.reason?.message || 'Network Error'}`);
            }


            // --- 3. Process Progress (ONLY if job data was successfully obtained) ---
            if (fetchedJobData) {
                if (progressRes.status === 'fulfilled' && progressRes.value.ok) {
                    try {
                        const data = await progressRes.value.json();
                        // Check if data is an object and has 'output' as a finite number
                        if (data && typeof data.output === 'number' && isFinite(data.output)) {
                            // Assuming output is 0-1, convert to 0-100
                            let calc = Math.round(data.output * 100);
                            fetchedProgress = Math.max(0, Math.min(100, calc));
                        } else { nonCriticalErrors.push("Invalid progress format or value."); }
                    } catch (e) { nonCriticalErrors.push("Failed to parse progress JSON."); }
                } else {
                    // Progress fetch failed - non-critical unless it's the only error AND job needs progress
                    const errorDetail = progressRes.status === 'rejected' ? (progressRes.reason?.message || 'Network Error') : `${progressRes.value.status} ${progressRes.value.statusText}`;
                    nonCriticalErrors.push(`Progress Error: ${errorDetail}`);

                    // Fallback: if progress fetch failed but the job is the same, keep the old progress
                    if (fetchedJobData?.jobid === localCurrentJobId) {
                        fetchedProgress = localProgressPercent;
                    }
                    // Note: If progress fetch fails for a *new* job, fetchedProgress remains 0.
                }
            } else {
                // No job data found (fetchedJobData is null), so progress is 0.
                fetchedProgress = 0;
                // If the job was there before but is now gone, add a non-critical message.
                if (localCurrentJobId !== null && jobFetchSuccessButNoJob) {
                    nonCriticalErrors.push("Job completed/cleared remotely.");
                }
            }


            // --- Update State Based on Fetched Data and Errors ---
            if (!isMounted.current) return; // Check again before setting state

            // Update job and progress states
            // Only update if the job changed OR the job is the same but progress changed
            if (fetchedJobData?.jobid !== localCurrentJobId) {
                setCurrentJob(fetchedJobData); // Will be null if no job found
                setProgressPercent(fetchedProgress);
                if (!fetchedJobData) setIsExpanded(false); // Collapse if job is gone
            } else if (fetchedJobData && fetchedProgress !== localProgressPercent) {
                // Job is the same, only progress changed
                setProgressPercent(fetchedProgress);
            } else if (!fetchedJobData && localCurrentJobId !== null) {
                // Job was present but is now gone (caught by jobFetchSuccessButNoJob)
                setCurrentJob(null);
                setProgressPercent(0);
                setIsExpanded(false); // Ensure collapse
            }


            // Update online status and last update time
            setDeviceIsOnline(fetchedDeviceOnline);
            setLastDeviceUpdate(fetchedLastUpdate);

            // Update error state with non-critical errors
            if (nonCriticalErrors.length > 0) {
                setFetchError(nonCriticalErrors.join('; '));
            } else {
                setFetchError(null); // Clear any previous non-critical errors if this fetch was clean
            }


        } catch (error) {
            // This catch block handles critical errors thrown inside the try block
            console.error("Critical fetch error caught:", error);
            if (!isMounted.current) return; // Check again before setting state

            // Set critical error state
            const errorMessage = error?.message || 'An unknown critical error occurred.';
            setFetchError(errorMessage);

            // Reset other states as a critical error means we can't trust the current state
            setCurrentJob(null);
            setProgressPercent(0);
            setDeviceIsOnline(false); // Assume offline if job fetch failed critically
            setLastDeviceUpdate(null);
            setIsExpanded(false);

        } finally {
            // Only set isLoading false on the *first* attempt
            if (isMounted.current && isInitialFetchAttempt.current) {
                setIsLoading(false);
                isInitialFetchAttempt.current = false; // Mark initial fetch as done
            }
        }
    }, [isExpanded, currentJob?.jobid, progressPercent]); // Reduced dependencies based on state variables used *before* update

    // --- Derived Status Calculation (Keep as is) ---
    const derivedStatus = useMemo(() => {
        if (isLoading) return 'loading';

        // Check if fetchError indicates a critical error
        const isCriticalError = fetchError && (
            fetchError.includes('Job Fetch Failed') ||
            fetchError.includes('Job API Error') ||
            fetchError.includes('Failed to parse Job JSON') ||
            fetchError.includes('Unexpected Error') // Catch the fallback error too
        );

        if (isCriticalError) {
            return 'error';
        }

        // Check for completion if a job exists
        if (currentJob) {
            if (progressPercent >= 100) { // Use >= 100 just in case calculation is slightly off
                return 'completed';
            }
            // If not completed, check online status
            return deviceIsOnline ? 'running' : 'paused';
        }

        // If no job exists and no critical error
        return 'idle';

    }, [isLoading, currentJob, deviceIsOnline, fetchError, progressPercent]);

    // --- Effect for Initial Fetch & Polling (Keep as is) ---
    useEffect(() => {
        isMounted.current = true;
        isInitialFetchAttempt.current = true; // Ensure flag is true on mount

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

    // --- Effect to Auto-collapse (Keep as is) ---
    useEffect(() => {
        if ((derivedStatus === 'idle' || derivedStatus === 'error' || derivedStatus === 'completed') && isExpanded) {
            setIsExpanded(false);
        }
    }, [derivedStatus, isExpanded]);

    // --- Toggle Handler (Keep as is) ---
    const toggleExpand = () => {
        if (currentJob && (derivedStatus === 'running' || derivedStatus === 'paused' || derivedStatus === 'completed')) {
            setIsExpanded(prev => !prev);
        }
    };

    // --- Helper to get Status Badge (Keep as is) ---
    const getStatusBadge = useMemo(() => {
        switch (derivedStatus) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 shadow-sm border border-green-200" title={`Completed. Last device update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}>
                        <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" /> Completed
                    </span>
                );
            case 'running':
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 shadow-sm border border-green-200" title={`Device online. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> In Progress</span> );
            case 'paused':
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 shadow-sm border border-orange-200" title={`Device offline or unresponsive. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faPause} className="w-4 h-4" /> Paused</span> );
            case 'idle':
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 shadow-sm border border-gray-200"><FontAwesomeIcon icon={faPauseCircle} className="w-4 h-4" /> Idle</span> );
            case 'error':
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 shadow-sm border border-red-200" title={fetchError || 'An error occurred'}><FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4" /> Error</span> );
            case 'loading':
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 shadow-sm border border-blue-200"><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin"/> Loading...</span> );
            default: return null;
        }
    }, [derivedStatus, lastDeviceUpdate, fetchError]);

    // --- Determine if details section can be shown/expanded (Keep as is) ---
    const canShowDetails = (derivedStatus === 'running' || derivedStatus === 'paused' || derivedStatus === 'completed') && !!currentJob;

    // --- Render (Keep as is) ---
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
                            {/* Only show retry if it's a critical fetch/API error */}
                            {(fetchError?.includes('Job Fetch Failed') || fetchError?.includes('Network Error') || fetchError?.includes('Job API Error') || fetchError?.includes('Failed to parse') || fetchError?.includes('Unexpected Error')) && (
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
                            {/* Display placeholder text based on derivedStatus */}
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight truncate" title={currentJob?.title || ''}>
                                {currentJob?.title || (derivedStatus === 'completed' ? 'Job Completed' : derivedStatus === 'idle' ? 'No Active Job' : derivedStatus === 'loading' ? 'Loading...' : derivedStatus === 'error' ? 'Update Failed' : 'Status Unavailable')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {getStatusBadge}
                            {/* Show expand button only if details can be shown */}
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

                    {/* Progress Bar Section - Show if currentJob exists AND is not idle/error/loading */}
                    {currentJob && (derivedStatus === 'running' || derivedStatus === 'paused' || derivedStatus === 'completed') && (
                        <div className="mt-4">
                            <div className="flex justify-between items-end mb-1.5">
                                <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5"/> Progress
                                    {/* Non-critical error display - Show if not critical error status */}
                                    {fetchError && derivedStatus !== 'error' && (
                                        <FontAwesomeIcon icon={faExclamationCircle} className="w-3.5 h-3.5 text-orange-500 ml-1" title={`Warning: ${fetchError}`} />
                                    )}
                                </span>
                                <span className="text-lg font-bold text-gray-800">{progressPercent}%</span>
                            </div>
                            <div className={`w-full bg-gray-200/80 rounded-full h-3.5 overflow-hidden shadow-inner relative ${derivedStatus === 'paused' ? 'opacity-70' : ''}`}>
                                {/* MODIFIED: Progress Bar Gradient based on derivedStatus */}
                                <motion.div
                                    key={currentJob.jobid + derivedStatus} // Add derivedStatus to key to re-trigger animation on status change
                                    className={`absolute inset-0 h-full rounded-full ${
                                        derivedStatus === 'paused' ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
                                            derivedStatus === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                                'bg-gradient-to-r from-blue-500 to-cyan-400'
                                    }`}
                                    initial={{ width: '0%' }}
                                    // Animate to the current progress. If status changes to completed, it re-animates to 100%
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.6, type: "spring", stiffness: 50, damping: 15 }}
                                />
                                <div className="absolute inset-0 h-full opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '40px 40px' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Idle Message - Show only if derivedStatus is idle and not loading */}
                    {derivedStatus === 'idle' && !isLoading && (
                        <div className="text-center pt-8 pb-4">
                            <FontAwesomeIcon icon={faPauseCircle} className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="text-gray-500 font-medium">The machine is currently idle.</p>
                            <p className="text-sm text-gray-400 mt-1">Waiting for the next job.</p>
                        </div>
                    )}

                    {/* Collapsible Details - Show only if expanded AND details can be shown */}
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
                                        {/* Check if currentJob.a, b, c exist before mapping, though canShowDetails implies currentJob exists */}
                                        {currentJob?.a !== undefined && <DetailItem icon={faBoxOpen} label="Quantity" value={currentJob?.a} unit="" color="indigo" />}
                                        {currentJob?.b !== undefined && <DetailItem icon={faRulerHorizontal} label="Length" value={currentJob?.b} unit="mm" color="teal" />}
                                        {currentJob?.c !== undefined && <DetailItem icon={faCut} label="Stripping" value={currentJob?.c} unit="mm" color="amber" />}
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
