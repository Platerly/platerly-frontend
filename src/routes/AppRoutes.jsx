import { useRoutes } from 'react-router-dom'
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
import TermsPage from '../pages/public/TermsPage'
import PrivacyPage from '../pages/public/PrivacyPage'
import GuidelinesPage from '../pages/public/GuidelinesPage'
import AllergyDisclaimerPage from '../pages/public/AllergyDisclaimerPage'
import RefundsPage from '../pages/public/RefundsPage'
import ContactPage from '../pages/public/ContactPage'
import NotFoundPage from '../pages/public/NotFoundPage'
import FollowListPage from '../pages/FollowListPage'
import AccountPage from '../components/account/AccountPage'

const AppRoutes = () =>
  useRoutes([
    // Marketing landing at root
    { path: '/', element: <Landing /> },

    // Public auth routes
    { path: '/register', element: <Register /> },
    { path: '/login', element: <Login /> },
    { path: '/verify-email', element: <VerifyEmail /> },
    { path: '/reset-password', element: <ResetPassword /> },
    { path: '/forgot-password', element: <ForgotPassword /> },

    { path: '/terms', element: <TermsPage /> },
    { path: '/privacy', element: <PrivacyPage /> },
    { path: '/guidelines', element: <GuidelinesPage /> },
    { path: '/disclaimer', element: <AllergyDisclaimerPage /> },
    { path: '/refunds', element: <RefundsPage /> },
    { path: '/contact', element: <ContactPage /> },

    // Protected
    { path: '/create', element: <RequireAuth><AppLayout><CreateRecipe /></AppLayout></RequireAuth> },
    { path: '/remix/:originalId', element: <RequireAuth><AppLayout><RemixPage /></AppLayout></RequireAuth> },
    { path: '/cookbooks', element: <RequireAuth><AppLayout><CookbookPage /></AppLayout></RequireAuth> },
    { path: '/cookbook/:id', element: <RequireAuth><AppLayout><CookbookDetailsPage /></AppLayout></RequireAuth> },
    { path: '/settings', element: <RequireAuth><AppLayout><SettingsPage /></AppLayout></RequireAuth> },
    { path: '/settings/allergies', element: <RequireAuth><AppLayout><AllergySettingsPage /></AppLayout></RequireAuth> },
    { path: '/settings/profile', element: <RequireAuth><AppLayout><MyProfileSettingsPage /></AppLayout></RequireAuth> },
    { path: '/edit-recipe/:id', element: <RequireAuth><AppLayout><EditRecipePage /></AppLayout></RequireAuth> },
    { path: '/user/:username/followers', element: <RequireAuth><AppLayout><FollowListPage type="followers" /></AppLayout></RequireAuth> },
    { path: '/user/:username/following', element: <RequireAuth><AppLayout><FollowListPage type="following" /></AppLayout></RequireAuth> },
    { path: '/account', element: <RequireAuth><AppLayout><AccountPage /></AppLayout></RequireAuth> },
    
    // Public content
    { path: '/feed', element: <AppLayout><Feed /></AppLayout>},
    { path: '/recipe/:id', element: <AppLayout><RecipeDetailsPage /></AppLayout> },
    { path: '/profile/:username', element: <AppLayout><UserProfilePage /></AppLayout> },
    { path: '/search', element: <AppLayout><SearchResultsPage /></AppLayout> },

    // Optional protected explore
    { path: '/explore-chefs', element: <RequireAuth><AppLayout><ExploreChefsPage /></AppLayout></RequireAuth> },

    { path: '*', element: <NotFoundPage /> },
  ])

export default AppRoutes
