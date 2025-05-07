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
const API_TODO_ENDPOINT = `${API_BASE_URL}/toDo`; // Corrected endpoint name based on usage
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
    const fetchAllStatus = useCallback(async () => {
        if (!isMounted.current) return;

        // Capture state *before* async calls for comparison
        const localCurrentJobId = currentJob?.jobid;
        const localProgressPercent = progressPercent;
        const localDeviceIsOnline = deviceIsOnline;
        const localFetchError = fetchError;
        const localLastDeviceUpdate = lastDeviceUpdate;

        let fetchedJobData = null;
        let fetchedProgress = localProgressPercent; // Start with previous progress in case fetch fails
        let fetchedDeviceOnline = false;
        let fetchedLastUpdate = null;
        let jobFetchOk = false;
        let jobDataFound = false;
        let progressFetchOk = false;
        let deviceStatusFetchOk = false;

        const errors = [];
        let criticalErrorOccurred = false;
        let jobDisappeared = false; // Flag to know if job was there, but now isn't

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
                fetch(API_TODO_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' }), // POST with empty body
                fetch(API_PROGRESS_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' }) // POST with empty body
            ]);

            const [statusRes, todoRes, progressRes] = results;

            // --- 1. Process Device Status ---
            if (statusRes.status === 'fulfilled') {
                if (statusRes.value.ok) {
                    try {
                        const data = await statusRes.value.json();
                        if (data && typeof data.time === 'number') {
                            const nowSeconds = Math.floor(Date.now() / 1000);
                            const deviceTimeSeconds = Math.floor(data.time);
                            const timeDiff = nowSeconds - deviceTimeSeconds;
                            // Check timeDiff >= 0 to avoid issues with device clock being ahead
                            fetchedDeviceOnline = timeDiff >= 0 && timeDiff < DEVICE_ONLINE_THRESHOLD_SECONDS;
                            fetchedLastUpdate = deviceTimeSeconds * 1000;
                            deviceStatusFetchOk = true;
                        } else { errors.push("Invalid device status format."); }
                    } catch (e) { errors.push("Failed to parse device status JSON."); }
                } else { errors.push(`Device Status API Error: ${statusRes.value.status} ${statusRes.value.statusText}`); }
            } else { errors.push(`Device Status Fetch Failed: ${statusRes.reason?.message || 'Network Error'}`); }

            // --- 2. Process Job Status (toDo endpoint) ---
            if (todoRes.status === 'rejected') {
                // If todo fetch fails, it's a critical error affecting job display
                criticalErrorOccurred = true;
                throw new Error(`Job Fetch Failed: ${todoRes.reason?.message || 'Network Error'}`);
            }
            jobFetchOk = true; // Fetch call itself succeeded, regardless of response status
            if (todoRes.value.ok) {
                try {
                    const data = await todoRes.value.json();
                    // Check if data is an array and has at least one item with jobid
                    if (Array.isArray(data) && data.length > 0 && data[0]?.jobid) {
                        fetchedJobData = data[0]; // Assuming the first item is the current job
                        jobDataFound = true;
                    } else {
                        // API returned OK but no job data (e.g., empty array)
                        jobDataFound = false;
                        if (localCurrentJobId) jobDisappeared = true; // Job was there, now isn't
                    }
                } catch (e) {
                    // JSON parsing failed for todo endpoint
                    criticalErrorOccurred = true; // Treat as critical because we can't read job data
                    throw new Error("Failed to parse job JSON response.");
                }
            } else if (todoRes.value.status === 404) {
                // API returned 404, explicitly stating no job
                jobDataFound = false;
                if (localCurrentJobId) jobDisappeared = true; // Job was there, now isn't
            } else {
                // Any other non-OK status from todo endpoint is a critical error
                criticalErrorOccurred = true;
                throw new Error(`Job API Error: ${todoRes.value.status} ${todoRes.value.statusText}`);
            }


            // --- 3. Process Progress (if job data found) ---
            if (jobDataFound) {
                // If job was found *and* progress fetch failed, we might use the old progress
                // Or, if the job is new, progress is 0.
                fetchedProgress = 0; // Reset optimistic local progress assumption for new job
                progressFetchOk = false; // Assume failure until proven otherwise
                if (progressRes.status === 'fulfilled') {
                    if (progressRes.value.ok) {
                        try {
                            const data = await progressRes.value.json();
                            // Check if data is an object and has 'output' as a finite number
                            if (data && typeof data.output === 'number' && isFinite(data.output)) {
                                // Assuming output is 0-1, convert to 0-100
                                let calc = Math.round(data.output * 100);
                                fetchedProgress = Math.max(0, Math.min(100, calc));
                                progressFetchOk = true;
                            } else { errors.push("Invalid progress format or value."); }
                        } catch (e) { errors.push("Failed to parse progress JSON."); }
                    } else { errors.push(`Progress API Error: ${progressRes.value.status} ${progressRes.value.statusText}`); }
                } else { errors.push(`Progress Fetch Failed: ${progressRes.reason?.message || 'Network Error'}`); }

                // If progress fetch failed BUT the job is the same as before, use previous progress
                if (!progressFetchOk && fetchedJobData?.jobid === localCurrentJobId) {
                    fetchedProgress = localProgressPercent;
                    // Non-critical error "Using previous progress..." added implicitly via errors array
                }
                // Note: If progress fetch fails for a *new* job, fetchedProgress remains 0.

            } else {
                // If no job data found (jobDisappeared is true or was already idle), reset progress
                fetchedProgress = 0;
            }


            // --- Update State Based on Fetched Data and Comparisons ---
            if (!isMounted.current) return; // Check again before setting state

            const jobIdentityChanged = fetchedJobData?.jobid !== localCurrentJobId;
            const progressChanged = fetchedProgress !== localProgressPercent;
            const onlineStatusChanged = fetchedDeviceOnline !== localDeviceIsOnline;
            const lastUpdateChanged = fetchedLastUpdate !== localLastDeviceUpdate;
            // Determine final error state: keep critical errors, or use new non-critical errors
            const newErrorString = errors.length > 0 ? errors.join('; ') : null;
            // If critical error occurred in THIS run, its message takes precedence
            const finalErrorString = criticalErrorOccurred
                ? (error?.message || 'A critical error occurred during fetch.') // Use the caught error message
                : (jobFetchOk && !jobDataFound && localCurrentJobId ? "Job completed/cleared remotely." : newErrorString); // If job disappeared AND no critical error, show message. Otherwise, show non-critical errors.

            const errorChanged = finalErrorString !== localFetchError;

            // Update Job and Progress states
            if (jobIdentityChanged) {
                setCurrentJob(fetchedJobData);
                setProgressPercent(fetchedProgress);
                // If job disappeared, collapse details
                if (!fetchedJobData) setIsExpanded(false);
            } else if (progressChanged) {
                setProgressPercent(fetchedProgress);
            }

            // Update Online Status and Last Update time
            if (onlineStatusChanged) setDeviceIsOnline(fetchedDeviceOnline);
            if (lastUpdateChanged) setLastDeviceUpdate(fetchedLastUpdate);

            // Update Error State
            // Only update error state if it changed AND either it's a critical error
            // OR it's a non-critical error AND no critical error occurred in this run.
            if (errorChanged) {
                // If a critical error just occurred, overwrite any existing error
                if (criticalErrorOccurred) {
                    setFetchError(error?.message || 'A critical error occurred.');
                } else {
                    // If no critical error this run, update with non-critical or cleared error
                    setFetchError(finalErrorString);
                }
            }


        } catch (error) {
            // This block specifically catches errors thrown *within* the try block
            // (like from raise_for_status or explicit throws)
            console.error("Critical fetch error caught:", error);
            if (!isMounted.current) return; // Check again before setting state

            // Set critical error state
            const errorMessage = error?.message || 'An unknown critical error occurred.';
            setFetchError(errorMessage);

            // Reset other states as a critical error means we can't trust the current state
            setCurrentJob(null);
            setProgressPercent(0);
            setDeviceIsOnline(false);
            setLastDeviceUpdate(null);
            setIsExpanded(false);

        } finally {
            // *** Key Change: Only set isLoading false on the *first* attempt ***
            if (isMounted.current && isInitialFetchAttempt.current) {
                setIsLoading(false);
                isInitialFetchAttempt.current = false; // Mark initial fetch as done
            }
            // If critical error happened in the try block, ensure error state is set by the catch block.
            // If it happened in the finally block (less likely), handle it here if needed.
        }
    }, [isExpanded, currentJob?.jobid, progressPercent, deviceIsOnline, fetchError, lastDeviceUpdate]); // Dependencies updated

    // --- Derived Status Calculation ---
    // MODIFIED: Added 'completed' state logic
    const derivedStatus = useMemo(() => {
        // Loading state is now only true very briefly on initial mount
        if (isLoading) return 'loading';

        // Check critical error first
        // Check if fetchError contains a critical error message
        const isCriticalError = fetchError && (fetchError.includes('Job Fetch Failed') || fetchError.includes('Job API Error') || fetchError.includes('Failed to parse job JSON'));
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

    }, [isLoading, currentJob, deviceIsOnline, fetchError, progressPercent]); // Add progressPercent to dependencies

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
    // MODIFIED: Now also auto-collapses on completion
    useEffect(() => {
        if ((derivedStatus === 'idle' || derivedStatus === 'error' || derivedStatus === 'completed') && isExpanded) {
            setIsExpanded(false);
        }
    }, [derivedStatus, isExpanded]);

    // --- Toggle Handler ---
    const toggleExpand = () => {
        // MODIFIED: Allow expanding if currentJob exists AND status is not error/loading/idle
        if (currentJob && (derivedStatus === 'running' || derivedStatus === 'paused' || derivedStatus === 'completed')) {
            setIsExpanded(prev => !prev);
        }
    };

    // --- Helper to get Status Badge ---
    // MODIFIED: Added 'completed' case
    const getStatusBadge = useMemo(() => {
        switch (derivedStatus) {
            case 'completed':
                // Displaying last update for completed status might be useful
                return (
                    <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 shadow-sm border border-green-200" title={`Completed. Last device update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}>
                        <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" /> Completed
                    </span>
                );
            case 'running':
                // Use Online/Offline status title for running/paused
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 shadow-sm border border-green-200" title={`Device online. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> In Progress</span> );
            case 'paused':
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 shadow-sm border border-orange-200" title={`Device offline or unresponsive. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faPause} className="w-4 h-4" /> Paused</span> );
            case 'idle':
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 shadow-sm border border-gray-200"><FontAwesomeIcon icon={faPauseCircle} className="w-4 h-4" /> Idle</span> );
            case 'error':
                // Display fetchError in title for error state
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 shadow-sm border border-red-200" title={fetchError || 'An error occurred'}><FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4" /> Error</span> );
            case 'loading':
                return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 shadow-sm border border-blue-200"><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin"/> Loading...</span> );
            default: return null;
        }
    }, [derivedStatus, lastDeviceUpdate, fetchError]);

    // --- Determine if details section can be shown/expanded ---
    // MODIFIED: Include 'completed' in canShowDetails
    const canShowDetails = (derivedStatus === 'running' || derivedStatus === 'paused' || derivedStatus === 'completed') && !!currentJob;

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
                            {/* Only show retry if it's a critical fetch/API error */}
                            {(fetchError?.includes('Fetch Failed') || fetchError?.includes('Network Error') || fetchError?.includes('API Error') || fetchError?.includes('Failed to parse')) && (
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
