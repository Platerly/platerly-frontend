import "./sentry";
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import './index.css'
import { Toaster } from 'react-hot-toast'
import SoftWallRoot from './components/softwall/SoftWallRoot'
import ReactGA from "react-ga4";

// Initialize GA only in production
if (import.meta.env.VITE_GA_ID && import.meta.env.VITE_ENV === "production") {
  ReactGA.initialize(import.meta.env.VITE_GA_ID);
  ReactGA.send("pageview");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <SoftWallRoot />
        <Toaster position="top-right" reverseOrder={false} />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
