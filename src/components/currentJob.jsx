// src/components/CurrentJobDisplay.jsx (Final Version - Syntax Checked & Progress Fix)
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner, faCogs, faExclamationCircle, faBoxOpen,
    faRulerHorizontal, faCut, faCheckCircle, faPauseCircle, faFileAlt,
    faChartLine, faChevronDown, faChevronUp, faWifi, faPause
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
const DEVICE_ONLINE_THRESHOLD_SECONDS = 5;
const POLLING_INTERVAL_MS = 3000;

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

// --- Main Component ---
function CurrentJobDisplay() {
    // --- State ---
    const [currentJob, setCurrentJob] = useState(null);
    const [progressPercent, setProgressPercent] = useState(0);
    const [deviceIsOnline, setDeviceIsOnline] = useState(false);
    const [lastDeviceUpdate, setLastDeviceUpdate] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    // --- API Endpoints ---
    const API_STATUS_ENDPOINT = 'https://vps.sumitsaw.tech/api/mcp101/status/last';
    const API_TODO_ENDPOINT = 'https://vps.sumitsaw.tech/api/mcp101/toDo';
    const API_PROGRESS_ENDPOINT = 'https://vps.sumitsaw.tech/api/mcp101/progress';

    // --- Fetching Logic ---
    const fetchAllStatus = async (isInitialFetch = false) => {
        if (isInitialFetch) {
            setIsLoading(true);
            setFetchError(null);
        }

        let fetchedJobData = null;
        let fetchedProgress = 0;
        let fetchedDeviceOnline = false;
        let fetchedLastUpdate = null;
        let jobStatusOk = false;
        let currentErrors = [];
        let criticalErrorOccurred = false;

        // Read current state *before* fetches for comparison
        const localCurrentJob = currentJob;
        const localProgressPercent = progressPercent;
        const localDeviceIsOnline = deviceIsOnline;
        const localFetchError = fetchError;
        const localLastDeviceUpdate = lastDeviceUpdate;
        const localIsExpanded = isExpanded;

        try {
            const [statusRes, todoRes, progressRes] = await Promise.allSettled([
                fetch(API_STATUS_ENDPOINT, { headers: { 'accept': 'application/json' }, cache: 'no-store' }),
                fetch(API_TODO_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' }),
                fetch(API_PROGRESS_ENDPOINT, { method: 'POST', headers: { 'accept': 'application/json' }, body: '', cache: 'no-store' })
            ]);

            // Process Device Status
            if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
                try {
                    const data = await statusRes.value.json();
                    if (data && typeof data.time === 'number') {
                        const timeDiff = Math.floor(Date.now() / 1000) - Math.floor(data.time);
                        fetchedDeviceOnline = timeDiff < DEVICE_ONLINE_THRESHOLD_SECONDS;
                        fetchedLastUpdate = data.time * 1000;
                    } else { currentErrors.push("Inv device status format."); }
                } catch (e) { currentErrors.push("Parse device status fail."); }
            } else { currentErrors.push(`Device API: ${statusRes.status === 'fulfilled' ? statusRes.value.statusText : statusRes.reason?.message || 'Unknown'}`); }

            // Process Job Status (Critical if fetch fails)
            if (todoRes.status === 'rejected') {
                criticalErrorOccurred = true;
                throw new Error(`Network error (Job): ${todoRes.reason?.message || 'Unknown'}`);
            }
            if (todoRes.status === 'fulfilled' && todoRes.value.ok) {
                try {
                    const data = await todoRes.value.json();
                    if (data && data.jobid) {
                        fetchedJobData = data;
                        jobStatusOk = true;
                    } else { currentErrors.push("Inv job data format."); }
                } catch (e) { currentErrors.push("Parse job JSON fail."); }
            } else if (todoRes.status === 'fulfilled' && todoRes.value.status !== 404) {
                currentErrors.push(`Job API: ${todoRes.value.statusText}`);
            } // 404 means jobStatusOk remains false (idle)

            // Process Progress (Only if job is OK)
            if (jobStatusOk) {
                let progressFetchSucceeded = false;
                if (progressRes.status === 'fulfilled' && progressRes.value.ok) {
                    try {
                        const data = await progressRes.value.json();
                        // Ensure 'output' exists and is a number before calculation
                        if (data && typeof data.output === 'number' && isFinite(data.output)) {
                            let calc = Math.round(data.output * 100);
                            fetchedProgress = Math.max(0, Math.min(100, calc)); // Clamp between 0 and 100
                            progressFetchSucceeded = true;
                        } else { currentErrors.push("Inv progress format or value."); }
                    } catch (e) { currentErrors.push("Parse progress fail."); }
                }
                if (!progressFetchSucceeded) {
                    const reason = progressRes.status === 'fulfilled'
                        ? `API Error ${progressRes.value.status} ${progressRes.value.statusText}`
                        : progressRes.reason?.message || 'Unknown fetch error';
                    currentErrors.push(`Progress API: ${reason}`);
                    console.warn(`Progress fetch failed: ${reason}`);
                    // Fallback: Keep current progress if job is the same, otherwise reset to 0
                    if (fetchedJobData?.jobid === localCurrentJob?.jobid) {
                        fetchedProgress = localProgressPercent;
                    } else { fetchedProgress = 0; }
                }
            } else { fetchedProgress = 0; } // Reset progress if no job


            // --- Conditional State Updates ---
            const jobIdentityChanged = (fetchedJobData?.jobid !== localCurrentJob?.jobid) || (!!fetchedJobData !== !!localCurrentJob);

            // 1. Update Job State & Associated Progress/Expansion
            if (jobIdentityChanged) {
                setCurrentJob(fetchedJobData);
                // *** FIX: Always update progress when job identity changes ***
                // This ensures the bar resets to 0% (or the correct initial %) for a new job.
                setProgressPercent(fetchedProgress);
                // Auto-collapse when job changes (e.g., goes from active to idle)
                if (localIsExpanded) {
                    setIsExpanded(false);
                }
            } else {
                // 2. Update Progress only if job is the same AND progress value changed
                if (fetchedProgress !== localProgressPercent) {
                    setProgressPercent(fetchedProgress);
                }
            }

            // 3. Update other states if they changed
            if (fetchedDeviceOnline !== localDeviceIsOnline) { setDeviceIsOnline(fetchedDeviceOnline); }
            if (fetchedLastUpdate !== localLastDeviceUpdate) { setLastDeviceUpdate(fetchedLastUpdate); }
            const newErrorString = currentErrors.length > 0 ? currentErrors.join('; ') : null;
            if (newErrorString !== localFetchError) { setFetchError(newErrorString); }

        } catch (criticalError) {
            criticalErrorOccurred = true;
            console.error("Critical fetch error:", criticalError);
            const critMsg = criticalError?.message || 'Unknown critical error';
            // Reset states only if they differ from the 'error' state defaults
            if (localFetchError !== critMsg) setFetchError(critMsg);
            if (localCurrentJob !== null) setCurrentJob(null);
            if (localProgressPercent !== 0) setProgressPercent(0); // Ensure progress resets on critical error
            if (localDeviceIsOnline !== false) setDeviceIsOnline(false);
            if (localLastDeviceUpdate !== null) setLastDeviceUpdate(null);
            if (localIsExpanded !== false) setIsExpanded(false);
        } finally {
            if (isInitialFetch) {
                setIsLoading(false);
            }
            // Ensure critical error is reflected if it occurred during fetch
            if (criticalErrorOccurred && (!fetchError || !fetchError.includes('Network error (Job)'))) {
                const critMsg = fetchError || 'Unknown critical error during fetch'; // Re-assert
                setFetchError(critMsg);
            }
        }
    };

    // --- Derived Status Calculation ---
    const derivedStatus = useMemo(() => {
        if (isLoading) return 'loading';
        if (fetchError && fetchError.toLowerCase().includes('network error (job)')) { return 'error'; }
        if (currentJob) { return deviceIsOnline ? 'running' : 'paused'; }
        else { return 'idle'; }
    }, [isLoading, currentJob, deviceIsOnline, fetchError]);

    // --- Effect for Polling ---
    useEffect(() => {
        const intervalFetch = () => { fetchAllStatus(false); };
        fetchAllStatus(true); // Initial fetch
        const intervalId = setInterval(intervalFetch, POLLING_INTERVAL_MS);
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Keep empty deps: fetchAllStatus is stable as it reads state internally

    // --- Effect to Auto-collapse on Idle or Critical Error ---
    useEffect(() => {
        if ((derivedStatus === 'idle' || derivedStatus === 'error') && isExpanded) {
            setIsExpanded(false);
        }
    }, [derivedStatus, isExpanded]);

    // --- Toggle Handler ---
    const toggleExpand = () => {
        setIsExpanded(prev => !prev);
    };

    // --- Helper to get Status Badge ---
    const getStatusBadge = () => {
        // ... (getStatusBadge function remains the same)
        switch (derivedStatus) {
            case 'running': return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 shadow-sm border border-green-200" title={`Device online. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> In Progress</span> );
            case 'paused':  return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 shadow-sm border border-orange-200" title={`Device offline. Last update: ${lastDeviceUpdate ? new Date(lastDeviceUpdate).toLocaleTimeString() : 'N/A'}`}><FontAwesomeIcon icon={faPause} className="w-4 h-4" /> Paused</span> );
            case 'idle':    return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 shadow-sm border border-gray-200"><FontAwesomeIcon icon={faPauseCircle} className="w-4 h-4" /> Idle</span> );
            case 'error':   return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 shadow-sm border border-red-200" title={fetchError || 'An error occurred'}><FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4" /> Error</span> );
            case 'loading': return ( <span className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 shadow-sm border border-blue-200"><FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin"/> Loading...</span> );
            default: return null;
        }
    };

    // --- Determine if details section can be shown/expanded ---
    const canShowDetails = (derivedStatus === 'running' || derivedStatus === 'paused') && !!currentJob;

    // --- Render ---
    return (
        <div className="p-4">
            <div className="bg-gradient-to-br from-white/70 via-white/80 to-cyan-50/60 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/80 relative min-h-[120px]">

                {/* Loading Overlay */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            key="loading-overlay"
                            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-md z-20 pointer-events-none"
                            variants={overlayVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }}>
                            <div className="text-center"> <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-cyan-500 animate-spin mb-3" /> <p className="text-gray-600 font-medium italic">Loading status...</p> </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Overlay */}
                <AnimatePresence>
                    {!isLoading && derivedStatus === 'error' && (
                        <motion.div
                            key="error-overlay"
                            className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 backdrop-blur-md z-10 p-4 text-center"
                            variants={overlayVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }}>
                            <FontAwesomeIcon icon={faExclamationCircle} className="w-10 h-10 text-red-500 mb-3" /> <p className="text-red-700 font-semibold text-lg">Status Update Error</p> <p className="text-sm text-red-600 mt-1 max-w-md">{fetchError || 'An unknown error occurred.'}</p> <button onClick={() => fetchAllStatus(true)} className="mt-4 px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"> Retry </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                {!isLoading && (
                    <div className={`p-5 transition-opacity duration-300 ${derivedStatus === 'error' ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <FontAwesomeIcon icon={faCogs} className="w-6 h-6 text-cyan-600 flex-shrink-0" />
                                <h2 className="text-xl font-bold text-gray-800 tracking-tight truncate">
                                    {currentJob?.title || (derivedStatus === 'idle' ? 'No Active Job' : derivedStatus === 'loading' ? 'Loading...' : derivedStatus === 'error' ? 'Error State' : 'Status Unavailable')}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {getStatusBadge()}
                                {canShowDetails && (
                                    <button onClick={toggleExpand} className="inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100/60 transition-colors" aria-expanded={isExpanded} title={isExpanded ? 'Collapse Details' : 'Show Details'}>
                                        <span>{isExpanded ? 'Collapse' : 'Details'}</span>
                                        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="w-4 h-4 ml-1.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar Section */}
                        {(derivedStatus === 'running' || derivedStatus === 'paused') && currentJob && (
                            <div className="mt-4">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5"/> Progress
                                        {/* Show warning icon next to progress if there was a non-critical fetch error */}
                                        {fetchError && derivedStatus !== 'error' && !fetchError.toLowerCase().includes('network error (job)') && (
                                            <FontAwesomeIcon icon={faExclamationCircle} className="w-3 h-3 text-orange-500 ml-1" title={`Warning: ${fetchError}`} />
                                        )}
                                    </span>
                                    <span className="text-lg font-bold text-gray-800">{progressPercent}%</span>
                                </div>
                                <div className={`w-full bg-gray-200/80 rounded-full h-3.5 overflow-hidden shadow-inner relative ${derivedStatus === 'paused' ? 'opacity-70' : ''}`}>
                                    <motion.div
                                        // Key change forces re-render & re-animation from initial
                                        key={currentJob.jobid || 'no-job-progress'}
                                        className={`absolute inset-0 h-full rounded-full ${derivedStatus === 'paused' ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                                        initial={{ width: '0%' }} // Always start from 0 visually on new job
                                        animate={{ width: `${progressPercent}%` }} // Animate to the current state's percentage
                                        transition={{ duration: 0.6, type: "spring", stiffness: 50, damping: 15 }}
                                    />
                                    {/* Optional: Subtle striping */}
                                    <div className="absolute inset-0 h-full opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '40px 40px' }}></div>
                                </div>
                            </div>
                        )}

                        {/* Idle Message */}
                        {derivedStatus === 'idle' && (
                            <div className="text-center pt-8 pb-4">
                                <FontAwesomeIcon icon={faPauseCircle} className="w-12 h-12 text-gray-400 mb-3" />
                                <p className="text-gray-500 font-medium">The machine is currently idle.</p>
                                <p className="text-sm text-gray-400 mt-1">No job is currently assigned.</p>
                            </div>
                        )}

                        {/* Collapsible Details */}
                        <AnimatePresence initial={false}>
                            {isExpanded && canShowDetails && (
                                <motion.div key="details-content" className="overflow-hidden" variants={detailsVariants} initial="collapsed" animate="expanded" exit="collapsed">
                                    <div className="space-y-4 pt-1">
                                        {/* Detail Items Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <DetailItem icon={faBoxOpen} label="Quantity" value={currentJob?.a} unit="" color="indigo" />
                                            <DetailItem icon={faRulerHorizontal} label="Length" value={currentJob?.b} unit="mm" color="teal" />
                                            <DetailItem icon={faCut} label="Stripping" value={currentJob?.c} unit="mm" color="amber" />
                                        </div>
                                        {/* Description Block */}
                                        {currentJob?.description && (
                                            <div className="p-3 bg-gray-50/80 rounded-lg border border-gray-200/70">
                                                <h4 className="flex items-center text-xs font-semibold text-gray-500 mb-1.5"> <FontAwesomeIcon icon={faFileAlt} className="w-3.5 h-3.5 mr-1.5 text-gray-400"/> Description </h4>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentJob.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CurrentJobDisplay;