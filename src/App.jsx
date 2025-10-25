import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import SoftWallRoot from './components/softwall/SoftWallRoot'
import { AnalyticsTracker } from "./components/AnalyticsTracker";


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <AnalyticsTracker />
        <SoftWallRoot />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
