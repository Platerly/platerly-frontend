/**
 * routes/AppRoutes.jsx — Layer: Routing / Route definitions
 *
 * Defines all client-side routes using react-router-dom v6 `useRoutes`.
 * Every page is lazy-loaded via React.lazy() for code-splitting so the initial
 * bundle only contains the code needed to render the landing page.
 *
 * Route protection levels:
 *  Public (no wrapper)   — Accessible to anyone; includes landing, auth pages, legal pages,
 *                          and content pages that are intentionally SEO-indexed.
 *  withLayout            — Adds AppLayout (nav + footer) but no auth check.
 *                          Used for feed/explore/recipe detail pages that guests can browse.
 *  withAuth / RequireAuth — Requires an authenticated session (token + user).
 *                          Redirects unauthenticated visitors to /login.
 *  withAdmin / RequireAdmin — Requires both authentication AND an admin role.
 *                          The `superAdminOnly` flag restricts certain pages further.
 *                          Admin pages use AdminLayout instead of AppLayout.
 *
 * Helper wrappers (defined inline):
 *  withSuspense(Component)          — Wraps in Suspense with PageLoader fallback; no layout/auth
 *  withLayout(Component, Layout)    — Suspense + Layout; no auth
 *  withAuth(Component, Layout)      — RequireAuth + Suspense + Layout
 *  withAdmin(Component, superOnly)  — RequireAdmin + Suspense + AdminLayout
 *
 * GA4 page tracking:
 *  RouteTracker is a renderless component that fires a GA4 pageview on every
 *  location change.  It is rendered alongside the route outlet so it tracks
 *  all navigations, including within the same "page" (e.g. modal-like routes).
 *
 * URL conventions:
 *  /:username/:slug           — SEO-friendly recipe URLs (preferred, e.g. /johndoe/pasta-carbonara)
 *  /recipe/:id                — Legacy GUID-based recipe URLs (backwards compatibility)
 *  /recipes/:idSlug           — Indexed (admin-uploaded) recipe detail pages
 *  /admin/*                   — Admin-only; not indexed by search engines
 */
import { Suspense, lazy, useEffect } from 'react'
import { useRoutes, useLocation } from 'react-router-dom'
import ReactGA from 'react-ga4'
import AppLayout from '../components/layout/AppLayout'
import RequireAuth from '../components/RequireAuth'
import RequireAdmin from '../components/RequireAdmin'
import AdminLayout from '../components/layout/AdminLayout'

/**
 * Full-screen loading spinner shown while a lazy-loaded page chunk is being
 * fetched.  Uses the app's dark background to prevent a white flash.
 */
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
const ExploreRecipesPage = lazy(() => import('../pages/ExploreRecipesPage'))
const IndexedRecipeDetailPage = lazy(() => import('../pages/IndexedRecipeDetailPage'))

// Public/legal pages
const TermsPage = lazy(() => import('../pages/public/TermsPage'))
const PrivacyPage = lazy(() => import('../pages/public/PrivacyPage'))
const GuidelinesPage = lazy(() => import('../pages/public/GuidelinesPage'))
const AllergyDisclaimerPage = lazy(() => import('../pages/public/AllergyDisclaimerPage'))
const RefundsPage = lazy(() => import('../pages/public/RefundsPage'))
const ContactPage = lazy(() => import('../pages/public/ContactPage'))
const ApiPage = lazy(() => import('../pages/public/ApiPage'))
const RoadmapPage = lazy(() => import('../pages/public/RoadmapPage'))
const BotPage = lazy(() => import('../pages/public/BotPage'))
const ResearchPage = lazy(() => import('../pages/public/ResearchPage'))
const IngredientsPage = lazy(() => import('../pages/public/IngredientsPage'))
const IngredientDetailPage = lazy(() => import('../pages/public/IngredientDetailPage'))
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'))
const CookiePolicyPage = lazy(() => import('../pages/public/CookiePolicyPage'))

// B2B pages
const B2BPricingPage = lazy(() => import('../pages/b2b/B2BPricingPage'))
const B2BBillingPage = lazy(() => import('../pages/b2b/B2BBillingPage'))

// Admin pages (only loaded when accessed — kept in a separate chunk)
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const ProhibitedIngredientsPage = lazy(() => import('../pages/admin/ProhibitedIngredientsPage'))
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'))
const AuditLogsPage = lazy(() => import('../pages/admin/AuditLogsPage'))

/**
 * Wraps a lazy component in Suspense with the PageLoader fallback.
 * No layout shell or auth check — used for standalone pages (landing, login, legal).
 *
 * @param {React.LazyExoticComponent} Component
 * @returns {JSX.Element}
 */
// eslint-disable-next-line no-unused-vars
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

/**
 * Wraps a lazy component in Suspense + a layout shell.
 * No auth check — used for publicly accessible pages that still need nav/footer.
 *
 * @param {React.LazyExoticComponent} Component
 * @param {React.ComponentType} Layout - Defaults to AppLayout
 * @returns {JSX.Element}
 */
// eslint-disable-next-line no-unused-vars
const withLayout = (Component, Layout = AppLayout) => (
  <Suspense fallback={<PageLoader />}>
    <Layout><Component /></Layout>
  </Suspense>
)

/**
 * Wraps a lazy component in RequireAuth + Suspense + a layout shell.
 * Redirects unauthenticated visitors to /login.
 *
 * @param {React.LazyExoticComponent} Component
 * @param {React.ComponentType} Layout - Defaults to AppLayout
 * @returns {JSX.Element}
 */
// eslint-disable-next-line no-unused-vars
const withAuth = (Component, Layout = AppLayout) => (
  <RequireAuth>
    <Suspense fallback={<PageLoader />}>
      <Layout><Component /></Layout>
    </Suspense>
  </RequireAuth>
)

/**
 * Wraps a lazy component in RequireAdmin + Suspense + AdminLayout.
 * RequireAdmin checks both authentication and admin role membership.
 *
 * @param {React.LazyExoticComponent} Component
 * @param {boolean} superAdminOnly - When true, restricts to super-admins only (e.g. user management, audit logs)
 * @returns {JSX.Element}
 */
const withAdmin = (Component, superAdminOnly = false) => (
  <RequireAdmin superAdminOnly={superAdminOnly}>
    <Suspense fallback={<PageLoader />}>
      <AdminLayout><Component /></AdminLayout>
    </Suspense>
  </RequireAdmin>
)

/**
 * Renderless component that scrolls to the top of the page on every route change.
 * Prevents the browser from preserving scroll position when navigating between pages.
 */
const ScrollToTop = () => {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return null
}

/**
 * Renderless component that fires a GA4 pageview on every route change.
 * Placed inside BrowserRouter so it has access to useLocation.
 * Only fires in production when VITE_GA_ID is set.
 */
const RouteTracker = () => {
  const location = useLocation()
  useEffect(() => {
    if (import.meta.env.VITE_GA_ID && import.meta.env.VITE_ENV === 'production') {
      // Only fire pageview if the user has consented to analytics cookies
      try {
        const stored = localStorage.getItem('rz_cookie_consent_v1')
        if (stored && JSON.parse(stored)?.analytics) {
          ReactGA.send({ hitType: 'pageview', page: location.pathname + location.search })
        }
      } catch { /* ignore */ }
    }
  }, [location])
  return null
}

const AppRoutes = () => {
  const routes = useRoutes([
    // Marketing landing at root — public, no layout shell
    { path: '/', element: withSuspense(Landing) },

    // Public auth routes — no layout shell, no auth required
    { path: '/register', element: withSuspense(Register) },
    { path: '/login', element: withSuspense(Login) },
    { path: '/verify-email', element: withSuspense(VerifyEmail) },
    { path: '/verify-email-change', element: withSuspense(VerifyEmailChange) },
    { path: '/verify/resend', element: withSuspense(ResendVerification) },
    { path: '/reset-password', element: withSuspense(ResetPassword) },
    { path: '/forgot-password', element: withSuspense(ForgotPassword) },

    // Legal/public pages — no layout shell, no auth required, publicly indexed
    { path: '/terms', element: withSuspense(TermsPage) },
    { path: '/privacy', element: withSuspense(PrivacyPage) },
    { path: '/guidelines', element: withSuspense(GuidelinesPage) },
    { path: '/disclaimer', element: withSuspense(AllergyDisclaimerPage) },
    { path: '/refunds', element: withSuspense(RefundsPage) },
    { path: '/contact', element: withSuspense(ContactPage) },
    { path: '/api', element: withSuspense(ApiPage) },
    { path: '/roadmap', element: withSuspense(RoadmapPage) },
    { path: '/bot', element: withSuspense(BotPage) },
    { path: '/research', element: withSuspense(ResearchPage) },
    { path: '/cookie-policy', element: withSuspense(CookiePolicyPage) },
    { path: '/ingredients', element: withSuspense(IngredientsPage) },
    { path: '/ingredients/:slug', element: withSuspense(IngredientDetailPage) },

    // Onboarding — protected (requires auth) but intentionally without the main layout
    // so new users see a focused full-screen onboarding experience
    { path: '/onboarding', element: (
      <RequireAuth>
        <Suspense fallback={<PageLoader />}>
          <OnboardingPage />
        </Suspense>
      </RequireAuth>
    )},

    // Protected routes — require authentication, rendered inside AppLayout
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
    // Follow list pages inline RequireAuth to pass the `type` prop directly to FollowListPage
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

    // Public content — with AppLayout but no auth required
    // Guests can browse these pages; the soft wall may appear after threshold views
    { path: '/feed', element: withLayout(Feed) },
    { path: '/trending', element: withLayout(TrendingPage) },
    { path: '/explore-recipes', element: withLayout(ExploreRecipesPage) },
    { path: '/recipes/:idSlug', element: withLayout(IndexedRecipeDetailPage) },
    // SEO-friendly recipe URLs: /username/recipe-slug (GitHub style)
    { path: '/:username/:slug', element: withLayout(RecipeDetailsPage) },
    // Legacy route for backwards compatibility (GUIDs still work)
    { path: '/recipe/:id', element: withLayout(RecipeDetailsPage) },
    { path: '/profile/:username', element: withLayout(UserProfilePage) },
    { path: '/search', element: withLayout(SearchResultsPage) },

    // Optional protected explore — requires auth (prevents guest spam on chef discovery)
    { path: '/explore-chefs', element: withAuth(ExploreChefsPage) },

    // B2B routes
    { path: '/b2b/pricing', element: withSuspense(B2BPricingPage) },
    { path: '/b2b/billing', element: withAuth(B2BBillingPage) },

    // Admin routes — require admin role; use AdminLayout; not indexed by search engines
    { path: '/admin', element: withAdmin(AdminDashboard) },
    { path: '/admin/prohibited-ingredients', element: withAdmin(ProhibitedIngredientsPage) },
    { path: '/admin/categories', element: withAdmin(ProhibitedIngredientsPage) },
    { path: '/admin/ingredients', element: withAdmin(ProhibitedIngredientsPage) },
    { path: '/admin/substitutions', element: withAdmin(ProhibitedIngredientsPage) },
    // superAdminOnly=true: user management and audit logs are restricted to super-admins
    { path: '/admin/users', element: withAdmin(UserManagementPage, true) },
    { path: '/admin/audit-logs', element: withAdmin(AuditLogsPage, true) },

    // 404 fallback — catches all unmatched paths
    { path: '*', element: withSuspense(NotFoundPage) },
  ])
  return (
    <>
      <ScrollToTop />
      <RouteTracker />
      {routes}
    </>
  )
}

export default AppRoutes
