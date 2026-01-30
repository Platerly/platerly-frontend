import "./sentry";
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import AppRoutes from './routes/AppRoutes'
import './index.css'
import { Toaster } from 'react-hot-toast'
import SoftWallRoot from './components/softwall/SoftWallRoot'
import ReactGA from "react-ga4";

// Temporary canonicalization in production: force www
if (import.meta.env.PROD && location.hostname === 'recipzee.com') {
  location.replace(`https://www.recipzee.com${location.pathname}${location.search}${location.hash}`);
}


// Initialize GA only in production
if (import.meta.env.VITE_GA_ID && import.meta.env.VITE_ENV === "production") {
  ReactGA.initialize(import.meta.env.VITE_GA_ID);
  ReactGA.send("pageview");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationsProvider>
        <BrowserRouter>
          <AppRoutes />
          <SoftWallRoot />
          <Toaster position="top-right" reverseOrder={false} />
        </BrowserRouter>
      </NotificationsProvider>
    </AuthProvider>
  </React.StrictMode>
)
