import { Suspense, lazy, useEffect } from 'react'
import { useRoutes, useLocation } from 'react-router-dom'
import ReactGA from 'react-ga4'
import AppLayout from '../components/layout/AppLayout'
import RequireAuth from '../components/RequireAuth'
import RequireAdmin from '../components/RequireAdmin'
import AdminLayout from '../components/layout/AdminLayout'

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-recipzee-dark flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-3 border-recipzee-accent border-t-transparent rounded-full animate-spin" />
      <span className="text-recipzee-muted text-sm">Loading...</span>
    </div>
  </div>
)

// Lazy-loaded pages for code-splitting
// Auth pages (small, load quickly)
const Landing = lazy(() => import('../pages/Landing'))
const Register = lazy(() => import('../pages/Register'))
const Login = lazy(() => import('../pages/Login'))
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'))
const VerifyEmailChange = lazy(() => import('../pages/VerifyEmailChange'))
const ResendVerification = lazy(() => import('../pages/ResendVerification'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'))

// Main app pages
const Feed = lazy(() => import('../pages/Feed'))
const CreateRecipe = lazy(() => import('../pages/CreateRecipe'))
const RemixPage = lazy(() => import('../pages/RemixPage'))
const RecipeDetailsPage = lazy(() => import('../pages/RecipeDetailsPage'))
const EditRecipePage = lazy(() => import('../pages/EditRecipePage'))

// User pages
const UserProfilePage = lazy(() => import('../pages/UserProfilePage'))
const FollowListPage = lazy(() => import('../pages/FollowListPage'))
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'))

// Cookbook pages
const CookbookPage = lazy(() => import('../pages/CookbookPage'))
const CookbookDetailsPage = lazy(() => import('../pages/CookbookDetailsPage'))
const ExploreCookbooksPage = lazy(() => import('../pages/ExploreCookbooksPage'))

// Shopping list
const ShoppingListPage = lazy(() => import('../pages/ShoppingListPage'))

// Meal planner
const MealPlannerPage = lazy(() => import('../pages/MealPlannerPage'))

// Widget preview (authenticated)
const WidgetPreviewPage = lazy(() => import('../pages/WidgetPreviewPage'))

// Settings pages
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const AllergySettingsPage = lazy(() => import('../pages/AllergySettingsTab'))
const MyProfileSettingsPage = lazy(() => import('../pages/EditProfileTab'))
const AccountPage = lazy(() => import('../components/account/AccountPage'))

// Explore pages
const SearchResultsPage = lazy(() => import('../pages/SearchResultsPage'))
const ExploreChefsPage = lazy(() => import('../pages/ExploreChefsPage'))
const TrendingPage = lazy(() => import('../pages/TrendingPage'))

// Public/legal pages
const TermsPage = lazy(() => import('../pages/public/TermsPage'))
const PrivacyPage = lazy(() => import('../pages/public/PrivacyPage'))
const GuidelinesPage = lazy(() => import('../pages/public/GuidelinesPage'))
const AllergyDisclaimerPage = lazy(() => import('../pages/public/AllergyDisclaimerPage'))
const RefundsPage = lazy(() => import('../pages/public/RefundsPage'))
const ContactPage = lazy(() => import('../pages/public/ContactPage'))
const ApiPage = lazy(() => import('../pages/public/ApiPage'))
const RoadmapPage = lazy(() => import('../pages/public/RoadmapPage'))
const IngredientsPage = lazy(() => import('../pages/public/IngredientsPage'))
const IngredientDetailPage = lazy(() => import('../pages/public/IngredientDetailPage'))
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'))

// Admin pages (only loaded when accessed)
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const ProhibitedIngredientsPage = lazy(() => import('../pages/admin/ProhibitedIngredientsPage'))
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'))
const AuditLogsPage = lazy(() => import('../pages/admin/AuditLogsPage'))

// Wrap component with Suspense
// eslint-disable-next-line no-unused-vars
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

// Wrap with Suspense and layout
// eslint-disable-next-line no-unused-vars
const withLayout = (Component, Layout = AppLayout) => (
  <Suspense fallback={<PageLoader />}>
    <Layout><Component /></Layout>
  </Suspense>
)

// Wrap with Suspense, layout, and auth
// eslint-disable-next-line no-unused-vars
const withAuth = (Component, Layout = AppLayout) => (
  <RequireAuth>
    <Suspense fallback={<PageLoader />}>
      <Layout><Component /></Layout>
    </Suspense>
  </RequireAuth>
)

// Wrap with Suspense, admin layout, and admin auth
const withAdmin = (Component, superAdminOnly = false) => (
  <RequireAdmin superAdminOnly={superAdminOnly}>
    <Suspense fallback={<PageLoader />}>
      <AdminLayout><Component /></AdminLayout>
    </Suspense>
  </RequireAdmin>
)

const RouteTracker = () => {
  const location = useLocation()
  useEffect(() => {
    if (import.meta.env.VITE_GA_ID && import.meta.env.VITE_ENV === 'production') {
      ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search })
    }
  }, [location])
  return null
}

const AppRoutes = () => {
  const routes = useRoutes([
    // Marketing landing at root
    { path: '/', element: withSuspense(Landing) },

    // Public auth routes
    { path: '/register', element: withSuspense(Register) },
    { path: '/login', element: withSuspense(Login) },
    { path: '/verify-email', element: withSuspense(VerifyEmail) },
    { path: '/verify-email-change', element: withSuspense(VerifyEmailChange) },
    { path: '/verify/resend', element: withSuspense(ResendVerification) },
    { path: '/reset-password', element: withSuspense(ResetPassword) },
    { path: '/forgot-password', element: withSuspense(ForgotPassword) },

    // Legal/public pages
    { path: '/terms', element: withSuspense(TermsPage) },
    { path: '/privacy', element: withSuspense(PrivacyPage) },
    { path: '/guidelines', element: withSuspense(GuidelinesPage) },
    { path: '/disclaimer', element: withSuspense(AllergyDisclaimerPage) },
    { path: '/refunds', element: withSuspense(RefundsPage) },
    { path: '/contact', element: withSuspense(ContactPage) },
    { path: '/api', element: withSuspense(ApiPage) },
    { path: '/roadmap', element: withSuspense(RoadmapPage) },
    { path: '/ingredients', element: withSuspense(IngredientsPage) },
    { path: '/ingredients/:slug', element: withSuspense(IngredientDetailPage) },

    // Onboarding (protected but without layout)
    { path: '/onboarding', element: (
      <RequireAuth>
        <Suspense fallback={<PageLoader />}>
          <OnboardingPage />
        </Suspense>
      </RequireAuth>
    )},

    // Protected routes
    { path: '/create', element: withAuth(CreateRecipe) },
    { path: '/remix/:originalId', element: withAuth(RemixPage) },
    { path: '/cookbooks', element: withAuth(CookbookPage) },
    { path: '/cookbook/:id', element: withAuth(CookbookDetailsPage) },
    { path: '/explore-cookbooks', element: withAuth(ExploreCookbooksPage) },
    { path: '/shopping-list', element: withAuth(ShoppingListPage) },
    { path: '/meal-planner', element: withAuth(MealPlannerPage) },
    { path: '/settings', element: withAuth(SettingsPage) },
    { path: '/settings/allergies', element: withAuth(AllergySettingsPage) },
    { path: '/settings/profile', element: withAuth(MyProfileSettingsPage) },
    { path: '/edit-recipe/:id', element: withAuth(EditRecipePage) },
    {
      path: '/user/:username/followers',
      element: (
        <RequireAuth>
          <Suspense fallback={<PageLoader />}>
            <AppLayout><FollowListPage type="followers" /></AppLayout>
          </Suspense>
        </RequireAuth>
      )
    },
    {
      path: '/user/:username/following',
      element: (
        <RequireAuth>
          <Suspense fallback={<PageLoader />}>
            <AppLayout><FollowListPage type="following" /></AppLayout>
          </Suspense>
        </RequireAuth>
      )
    },
    { path: '/account', element: withAuth(AccountPage) },
    { path: '/widget-preview', element: withAuth(WidgetPreviewPage) },
    { path: '/notifications', element: withAuth(NotificationsPage) },

    // Public content (with layout but no auth required)
    { path: '/feed', element: withLayout(Feed) },
    { path: '/trending', element: withLayout(TrendingPage) },
    // SEO-friendly recipe URLs: /username/recipe-slug (GitHub style)
    { path: '/:username/:slug', element: withLayout(RecipeDetailsPage) },
    // Legacy route for backwards compatibility (GUIDs still work)
    { path: '/recipe/:id', element: withLayout(RecipeDetailsPage) },
    { path: '/profile/:username', element: withLayout(UserProfilePage) },
    { path: '/search', element: withLayout(SearchResultsPage) },

    // Optional protected explore
    { path: '/explore-chefs', element: withAuth(ExploreChefsPage) },

    // Admin routes (protected, no indexing, no analytics)
    { path: '/admin', element: withAdmin(AdminDashboard) },
    { path: '/admin/prohibited-ingredients', element: withAdmin(ProhibitedIngredientsPage) },
    { path: '/admin/categories', element: withAdmin(ProhibitedIngredientsPage) },
    { path: '/admin/ingredients', element: withAdmin(ProhibitedIngredientsPage) },
    { path: '/admin/substitutions', element: withAdmin(ProhibitedIngredientsPage) },
    { path: '/admin/users', element: withAdmin(UserManagementPage, true) },
    { path: '/admin/audit-logs', element: withAdmin(AuditLogsPage, true) },

    // 404 fallback
    { path: '*', element: withSuspense(NotFoundPage) },
  ])
  return (
    <>
      <RouteTracker />
      {routes}
    </>
  )
}

export default AppRoutes
