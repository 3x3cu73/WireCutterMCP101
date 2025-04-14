import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'


// Mobile-first responsive configuration
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <div className="min-h-screen flex flex-col">
                <App className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" />
                {/*<SpeedInsights />*/}
            </div>
        </BrowserRouter>
    </StrictMode>
)
