import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, AlertCircle } from 'lucide-react'

const Landing = () => {
  const { authed } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authed) {
      navigate('/feed', { replace: true })
    }
  }, [authed, navigate])

  useEffect(() => {
    document.title = 'Recipzee — Nickel Allergy Recipes & Allergy-Safe Cooking Community'
  }, [])

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text relative overflow-hidden">
      <Helmet>
        <title>Recipzee — Nickel Allergy Recipes &amp; Allergy-Safe Cooking Community</title>
        <meta name="description" content="Recipzee is the only recipe community built for nickel allergy sufferers — and every other allergy too. Find low-nickel recipes, flag allergens instantly, and cook with total confidence." />
        <link rel="canonical" href="https://www.recipzee.com/" />
      </Helmet>

      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-recipzee-green/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 sm:py-16">

        {/* ── Above the fold: two columns on desktop ── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16">

          {/* Left — pitch */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-recipzee-green/10 border border-recipzee-green/20 text-recipzee-green text-sm font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-recipzee-green" />
              7-day Premium trial — no card required
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-5">
              Recipes built for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-recipzee-green to-emerald-400">
                every allergy
              </span>
            </h1>

            <p className="text-lg text-recipzee-subtle leading-relaxed mb-8">
              The intelligent recipe community that understands your allergies —
              from nickel and gluten to dairy and shellfish. Share, discover,
              and cook with total confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-recipzee-green/20">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link
                to="/feed?tab=explore"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-recipzee-border text-recipzee-subtle hover:text-recipzee-text hover:border-recipzee-green/30 transition-colors text-sm font-medium"
              >
                Browse recipes first
              </Link>
            </div>

            <p className="mt-4 text-sm text-recipzee-subtle">
              Already have an account?{' '}
              <Link to="/login" className="text-recipzee-green hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Right — pricing */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            {/* Free */}
            <div className="rounded-2xl border border-recipzee-border bg-white/5 p-5">
              <p className="text-xs font-semibold text-recipzee-subtle uppercase tracking-wide mb-2">Free</p>
              <p className="text-2xl font-bold mb-1">$0</p>
              <p className="text-xs text-recipzee-subtle mb-4">Forever free</p>
              <ul className="space-y-2 text-xs text-recipzee-subtle">
                <li className="flex items-start gap-1.5"><span className="text-recipzee-green mt-0.5">✓</span> Browse & save recipes</li>
                <li className="flex items-start gap-1.5"><span className="text-recipzee-green mt-0.5">✓</span> Follow chefs & cookbooks</li>
                <li className="flex items-start gap-1.5"><span className="text-recipzee-green mt-0.5">✓</span> 3 allergen scans/week</li>
                <li className="flex items-start gap-1.5"><span className="text-zinc-600 mt-0.5">✗</span> Unlimited scans</li>
                <li className="flex items-start gap-1.5"><span className="text-zinc-600 mt-0.5">✗</span> Allergen feed filter</li>
                <li className="flex items-start gap-1.5"><span className="text-zinc-600 mt-0.5">✗</span> Recipe remixing</li>
              </ul>
            </div>

            {/* Premium */}
            <div className="rounded-2xl border border-recipzee-green/40 bg-recipzee-green/5 p-5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-recipzee-green text-recipzee-dark text-[10px] font-bold px-2.5 py-1 rounded-full">7 DAYS FREE</span>
              </div>
              <p className="text-xs font-semibold text-recipzee-green uppercase tracking-wide mb-2">Premium</p>
              <p className="text-2xl font-bold mb-1">$6.99<span className="text-sm font-normal text-recipzee-subtle">/mo</span></p>
              <p className="text-xs text-recipzee-subtle mb-4">Cancel anytime</p>
              <ul className="space-y-2 text-xs text-recipzee-subtle">
                <li className="flex items-start gap-1.5"><span className="text-recipzee-green mt-0.5">✓</span> Everything in Free</li>
                <li className="flex items-start gap-1.5"><span className="text-recipzee-green mt-0.5">✓</span> Unlimited scans</li>
                <li className="flex items-start gap-1.5"><span className="text-recipzee-green mt-0.5">✓</span> Allergen feed filter</li>
                <li className="flex items-start gap-1.5"><span className="text-recipzee-green mt-0.5">✓</span> Recipe remixing</li>
                <li className="flex items-start gap-1.5"><span className="text-recipzee-green mt-0.5">✓</span> Trending ingredients</li>
              </ul>
              <Link to="/register" className="mt-4 block text-center bg-recipzee-green text-recipzee-dark font-semibold py-2 rounded-xl hover:opacity-90 transition-opacity text-xs">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-center mb-12 py-8 border-y border-recipzee-border">
          <div>
            <div className="text-2xl sm:text-3xl font-bold">14</div>
            <div className="text-sm text-recipzee-subtle">Allergens Tracked</div>
          </div>
          <div className="w-px h-10 bg-recipzee-border hidden sm:block" />
          <div>
            <div className="text-2xl sm:text-3xl font-bold">1,400+</div>
            <div className="text-sm text-recipzee-subtle">Ingredient Mappings</div>
          </div>
          <div className="w-px h-10 bg-recipzee-border hidden sm:block" />
          <div>
            <div className="text-2xl sm:text-3xl font-bold">387+</div>
            <div className="text-sm text-recipzee-subtle">Ingredient Substitutions</div>
          </div>
        </div>

        {/* ── Nickel Allergy Section ── */}
        <div className="mb-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-1">Built for Nickel Allergy Sufferers</h2>
              <p className="text-sm text-recipzee-subtle leading-relaxed">
                Nickel allergy is one of the most common contact allergies — yet almost no recipe apps recognise it.
                Recipzee is different. Every recipe can be tagged as <strong className="text-amber-400">Low Nickel</strong>, so you
                can browse, filter, and cook without second-guessing every ingredient.
              </p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-3 gap-3 text-sm text-recipzee-subtle">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Filter recipes by Low Nickel sensitivity</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Instant allergen scan on every recipe</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Ingredient substitutions for high-nickel foods</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Set your nickel allergy in your profile once</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Community of nickel-conscious cooks</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />Share your own low-nickel recipes</li>
          </ul>
        </div>

        {/* ── Footer links ── */}
        <div className="text-center text-sm text-recipzee-subtle">
          <Link to="/privacy" className="hover:text-recipzee-text transition-colors px-2">Privacy</Link>
          <span className="text-recipzee-border">•</span>
          <Link to="/terms" className="hover:text-recipzee-text transition-colors px-2">Terms</Link>
        </div>

      </div>
    </div>
  )
}

export default Landing
