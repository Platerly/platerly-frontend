/**
 * Landing.jsx
 * Layer: Public / Marketing — main landing / home page
 *
 * The public-facing entry point for unauthenticated visitors. Authenticated
 * users are immediately redirected to /feed on mount so they never see this.
 *
 * Page sections (top to bottom):
 *   1. Hero             — headline "Know what's in your recipes before you cook them",
 *                         sub-copy covering 13 allergens including nickel, primary
 *                         CTA ("Try it free for 7 days" → /register), secondary
 *                         link to /feed?tab=explore, sign-in link.
 *   2. Why it's different — three feature highlight cards:
 *                         Instant allergen scan, Allergen-aware substitutions,
 *                         Filter your feed.
 *   3. Nickel callout   — amber callout box positioning Recipzee as the only
 *                         recipe app that tracks nickel allergy; 6-point feature
 *                         list specific to nickel users.
 *   4. Explore feature  — "New" section card promoting the halal-verified
 *                         recipe index (Recipzee Bot feed), CTA → /explore-recipes.
 *   5. Pricing          — Free ($0) vs Premium ($6.99/mo) side-by-side cards;
 *                         Premium card is highlighted with a "7 DAYS FREE" badge.
 *   6. Final CTA        — repeat registration CTA button, no-card disclaimer.
 *   7. Footer nav       — inline links to /privacy, /terms, /api.
 *
 * SEO: Helmet sets the canonical URL and a full meta description targeting
 * nickel allergy and allergen-aware cooking search terms.
 */
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, AlertCircle, ShieldCheck, Shuffle, Filter } from 'lucide-react'

/**
 * @returns {JSX.Element}
 */
const Landing = () => {
  const { authed } = useAuth()
  const navigate = useNavigate()

  // Redirect authenticated users straight to the feed — landing page is for guests only
  useEffect(() => {
    if (authed) navigate('/feed', { replace: true })
  }, [authed, navigate])

  // Set document.title directly in addition to the Helmet tag for faster paint
  useEffect(() => {
    document.title = 'Recipzee — Nickel Allergy Recipes & Allergen-Aware Cooking Community'
  }, [])

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      <Helmet>
        <title>Recipzee — Nickel Allergy Recipes &amp; Allergen-Aware Cooking Community</title>
        <meta name="description" content="Recipzee is the only recipe community built for nickel allergy sufferers — and every other allergy too. Find low-nickel recipes, flag allergens instantly, and cook with total confidence." />
        <link rel="canonical" href="https://www.recipzee.com/" />
      </Helmet>

      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-recipzee-green/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-16 sm:py-24">

        {/* ── HERO ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-recipzee-green/10 border border-recipzee-green/20 text-recipzee-green text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-recipzee-green" />
            7-day Premium trial — no card required
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Know what's in your recipes
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-recipzee-green to-emerald-400">
              before you cook them
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-recipzee-subtle max-w-xl mx-auto mb-10 leading-relaxed">
            Open any recipe and instantly see if it contains your flagged allergens —
            nickel, gluten, dairy, shellfish, and 10 more.
            No guessing. No label-reading. Make informed food choices.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="min-w-[220px] shadow-lg shadow-recipzee-green/20 text-base">
                Try it free for 7 days
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link
              to="/feed?tab=explore"
              className="text-sm text-recipzee-subtle hover:text-recipzee-text transition-colors"
            >
              Browse recipes first →
            </Link>
          </div>

          <p className="mt-4 text-xs text-recipzee-subtle">
            Already have an account?{' '}
            <Link to="/login" className="text-recipzee-green hover:underline">Sign in</Link>
          </p>
        </div>

        {/* ── WHY IT'S DIFFERENT ── */}
        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="w-9 h-9 rounded-lg bg-recipzee-green/20 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-recipzee-green" />
            </div>
            <h3 className="font-semibold mb-1">Instant allergen scan</h3>
            <p className="text-sm text-recipzee-subtle">
              Open any recipe and see exactly which ingredients conflict with your allergies — highlighted instantly.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="w-9 h-9 rounded-lg bg-recipzee-green/20 flex items-center justify-center mb-3">
              <Shuffle className="w-5 h-5 text-recipzee-green" />
            </div>
            <h3 className="font-semibold mb-1">Allergen-aware substitutions</h3>
            <p className="text-sm text-recipzee-subtle">
              Click any ingredient to see community-tested alternatives with confidence scores and conversion ratios.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="w-9 h-9 rounded-lg bg-recipzee-green/20 flex items-center justify-center mb-3">
              <Filter className="w-5 h-5 text-recipzee-green" />
            </div>
            <h3 className="font-semibold mb-1">Filter your feed</h3>
            <p className="text-sm text-recipzee-subtle">
              Hide recipes that contain your allergens from the entire feed — browse thousands of recipes without the anxiety.
            </p>
          </div>
        </div>

        {/* ── NICKEL ALLERGY CALLOUT ── */}
        <div className="mb-16 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-1">
                The only recipe app that takes nickel allergy seriously
              </h2>
              <p className="text-sm text-recipzee-subtle leading-relaxed">
                Nickel allergy affects millions — yet almost no recipe apps recognise it.
                Recipzee tracks nickel content, lets you filter by <strong className="text-amber-400">Low Nickel</strong>,
                and flags high-nickel ingredients the moment you open a recipe.
              </p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-3 gap-3 text-sm text-recipzee-subtle">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Filter by Low Nickel sensitivity</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Instant scan flags high-nickel ingredients</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Safe substitutions for high-nickel foods</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Set your allergy once, protected everywhere</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Community of nickel-conscious cooks</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Share your own low-nickel recipes</li>
          </ul>
        </div>

        {/* ── EXPLORE RECIPES FEATURE ── */}
        <div className="mb-16 rounded-2xl border border-recipzee-green/20 bg-gradient-to-br from-recipzee-card to-recipzee-light overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-start gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-recipzee-green/15 border border-recipzee-green/30 px-3 py-1 text-xs font-semibold text-recipzee-green uppercase tracking-wider">
                ✦ New
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-recipzee-text mb-3 leading-snug">
              Discover halal recipes from across the internet
            </h2>
            <p className="text-recipzee-subtle text-base mb-6 max-w-xl leading-relaxed">
              Every recipe verified halal and analysed for your allergen profile before you cook it.
              Browse thousands of dishes from trusted sources — every one screened by the Recipzee Halal Gate,
              with full nickel load and allergen intelligence built in.
            </p>

            <ul className="grid sm:grid-cols-2 gap-2.5 text-sm text-recipzee-subtle mb-8">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-recipzee-green shrink-0" />
                Every recipe individually halal-verified
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-recipzee-green shrink-0" />
                Allergen analysis on every recipe
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-recipzee-green shrink-0" />
                Nickel load calculated per recipe
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-recipzee-green shrink-0" />
                Filter by cuisine, allergens, or nickel risk
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-recipzee-green shrink-0" />
                Save any recipe to your cookbooks
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-recipzee-green shrink-0" />
                Source attribution on every result
              </li>
            </ul>

            <Link
              to="/explore-recipes"
              className="inline-flex items-center gap-2 rounded-2xl bg-recipzee-green px-6 py-3 font-semibold text-sm text-recipzee-dark hover:opacity-90 transition-opacity shadow-lg shadow-recipzee-green/20"
            >
              Explore halal recipes →
            </Link>
          </div>
        </div>

        {/* ── PRICING ── */}
        <div className="mb-16">
          <h2 className="text-center text-2xl font-bold mb-2">Simple pricing</h2>
          <p className="text-center text-recipzee-subtle text-sm mb-8">Start free. Upgrade if you need more.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free */}
            <div className="rounded-2xl border border-recipzee-border bg-white/5 p-6">
              <p className="text-sm font-semibold text-recipzee-subtle uppercase tracking-wide mb-2">Free</p>
              <p className="text-3xl font-bold mb-1">$0</p>
              <p className="text-sm text-recipzee-subtle mb-6">No card needed, forever free</p>
              <ul className="space-y-3 text-sm text-recipzee-subtle mb-6">
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> Browse & save recipes</li>
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> Follow chefs & create cookbooks</li>
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> 3 allergen scans per week</li>
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> Ingredient substitution suggestions</li>
              </ul>
              <Link
                to="/register"
                className="block text-center border border-recipzee-border text-recipzee-subtle py-2.5 rounded-xl hover:border-recipzee-green/30 hover:text-recipzee-text transition-colors text-sm font-medium"
              >
                Get started free
              </Link>
            </div>

            {/* Premium */}
            <div className="rounded-2xl border border-recipzee-green/40 bg-recipzee-green/5 p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-recipzee-green text-recipzee-dark text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">7 DAYS FREE</span>
              </div>
              <p className="text-sm font-semibold text-recipzee-green uppercase tracking-wide mb-2">Premium</p>
              <p className="text-3xl font-bold mb-1">$6.99<span className="text-base font-normal text-recipzee-subtle">/mo</span></p>
              <p className="text-sm text-recipzee-subtle mb-6">Cancel anytime</p>
              <ul className="space-y-3 text-sm text-recipzee-subtle mb-6">
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> Everything in Free</li>
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> Unlimited allergen scans</li>
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> Hide allergens from your feed</li>
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> Recipe remixing</li>
                <li className="flex items-start gap-2"><span className="text-recipzee-green mt-0.5">✓</span> Trending ingredients</li>
              </ul>
              <Link
                to="/register"
                className="block text-center bg-recipzee-green text-recipzee-dark font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
              >
                Start 7-day free trial
              </Link>
            </div>
          </div>
        </div>

        {/* ── FINAL CTA ── */}
        <div className="text-center mb-16">
          <p className="text-recipzee-subtle mb-4 text-sm">Ready to cook without the anxiety?</p>
          <Link to="/register">
            <Button size="lg" className="shadow-lg shadow-recipzee-green/20">
              Start your free trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-recipzee-subtle">No credit card required · Cancel anytime</p>
        </div>

        {/* ── FOOTER ── */}
        <div className="text-center text-sm text-recipzee-subtle">
          <Link to="/privacy" className="hover:text-recipzee-text transition-colors px-2">Privacy</Link>
          <span className="text-recipzee-border">•</span>
          <Link to="/terms" className="hover:text-recipzee-text transition-colors px-2">Terms</Link>
          <span className="text-recipzee-border">•</span>
          <Link to="/api" className="hover:text-recipzee-text transition-colors px-2">API</Link>
        </div>

      </div>
    </div>
  )
}

export default Landing
