import { useRoutes, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import RequireAuth from '../components/RequireAuth'
import Landing from '../pages/Landing'
import Register from '../pages/Register'
import Login from '../pages/Login'
import VerifyEmail from '../pages/VerifyEmail'
import Feed from '../pages/Feed'
import CreateRecipe from '../pages/CreateRecipe'
import RemixPage from '../pages/RemixPage'
import RecipeDetailsPage from '../pages/RecipeDetailsPage'
import CookbookPage from '../pages/CookbookPage'
import CookbookDetailsPage from '../pages/CookbookDetailsPage'
import AllergySettingsPage from '../pages/AllergySettingsTab'
import MyProfileSettingsPage from '../pages/EditProfileTab'
import UserProfilePage from '../pages/UserProfilePage'
import SearchResultsPage from '../pages/SearchResultsPage'
import ExploreChefsPage from '../pages/ExploreChefsPage'
import SettingsPage from '../pages/SettingsPage'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import EditRecipePage from '../pages/EditRecipePage'
import { useAuth } from '../context/AuthContext'

// Inline smart root redirect
function RootRedirect() {
  const { user, token, loading } = useAuth()
  if (loading) return null
  const stored = (typeof window !== 'undefined')
    ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
    : null
  return (user || token || stored)
    ? <Navigate to="/feed" replace />
    : <Navigate to="/login" replace />
}

const AppRoutes = () =>
  useRoutes([
    // Root decides where to go
    { path: '/', element: <RootRedirect /> },

    // Keep the marketing page (optional) at /welcome
    { path: '/welcome', element: <Landing /> },

    // Public auth routes
    { path: '/register', element: <Register /> },
    { path: '/login', element: <Login /> },
    { path: '/verify-email', element: <VerifyEmail /> },
    { path: '/reset-password', element: <ResetPassword /> },
    { path: '/forgot-password', element: <ForgotPassword /> },

    // Protected
    { path: '/feed', element: <RequireAuth><AppLayout><Feed /></AppLayout></RequireAuth> },
    { path: '/create', element: <RequireAuth><AppLayout><CreateRecipe /></AppLayout></RequireAuth> },
    { path: '/remix/:originalId', element: <RequireAuth><AppLayout><RemixPage /></AppLayout></RequireAuth> },
    { path: '/cookbooks', element: <RequireAuth><AppLayout><CookbookPage /></AppLayout></RequireAuth> },
    { path: '/cookbook/:id', element: <RequireAuth><AppLayout><CookbookDetailsPage /></AppLayout></RequireAuth> },
    { path: '/settings', element: <RequireAuth><AppLayout><SettingsPage /></AppLayout></RequireAuth> },
    { path: '/settings/allergies', element: <RequireAuth><AppLayout><AllergySettingsPage /></AppLayout></RequireAuth> },
    { path: '/settings/profile', element: <RequireAuth><AppLayout><MyProfileSettingsPage /></AppLayout></RequireAuth> },
    { path: '/edit-recipe/:id', element: <RequireAuth><AppLayout><EditRecipePage /></AppLayout></RequireAuth> },

    // Public content
    { path: '/recipe/:id', element: <AppLayout><RecipeDetailsPage /></AppLayout> },
    { path: '/profile/:username', element: <AppLayout><UserProfilePage /></AppLayout> },
    { path: '/search', element: <AppLayout><SearchResultsPage /></AppLayout> },

    // Optional protected explore
    { path: '/explore-chefs', element: <RequireAuth><AppLayout><ExploreChefsPage /></AppLayout></RequireAuth> },
  ])

export default AppRoutes
