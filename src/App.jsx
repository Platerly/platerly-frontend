import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import AppRoutes from './routes/AppRoutes'
import SoftWallRoot from './components/softwall/SoftWallRoot'
import { AnalyticsTracker } from "./components/AnalyticsTracker"
import ErrorBoundary from './components/ErrorBoundary'


const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
            <SoftWallRoot>
              <AppRoutes />
              <AnalyticsTracker />
            </SoftWallRoot>
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
