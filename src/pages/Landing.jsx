import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { Helmet } from 'react-helmet-async'
import { Shield, Sparkles, Users, ChefHat, ArrowRight, AlertCircle } from 'lucide-react'

// eslint-disable-next-line no-unused-vars
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
    <div className="shrink-0 w-10 h-10 rounded-lg bg-recipzee-green/20 flex items-center justify-center">
      <Icon className="w-5 h-5 text-recipzee-green" />
    </div>
    <div>
      <h3 className="font-semibold text-recipzee-text">{title}</h3>
      <p className="text-sm text-recipzee-subtle mt-0.5">{description}</p>
    </div>
  </div>
)

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

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-recipzee-green/10 border border-recipzee-green/20 text-recipzee-green text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              The future of recipe sharing
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              Recipes designed for
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-recipzee-green to-emerald-400">
                every dietary need
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-recipzee-subtle max-w-2xl mx-auto mb-8 leading-relaxed">
              Recipzee is the intelligent recipe network that understands your allergies
              — from nickel and gluten to dairy and shellfish.
              Share, discover, and cook with confidence.
            </p>

            {/* Single Primary CTA */}
            <div className="flex flex-col items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="min-w-[240px] shadow-lg shadow-recipzee-green/20 text-lg py-4">
                  Start Free — 7 Days Premium
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="text-sm text-recipzee-subtle">No credit card required · Cancel anytime</p>
            </div>

            {/* Secondary links */}
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <Link
                to="/login"
                className="text-recipzee-subtle hover:text-recipzee-text transition-colors"
              >
                Already have an account? Sign in
              </Link>
              <span className="text-recipzee-border">•</span>
              <Link
                to="/feed?tab=explore"
                className="text-recipzee-subtle hover:text-recipzee-text transition-colors"
              >
                Browse first
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <FeatureCard
              icon={Shield}
              title="Allergy Protection"
              description="Flags allergens in every recipe — including nickel, gluten, dairy, and 11 more."
            />
            <FeatureCard
              icon={ChefHat}
              title="Premium Cookbooks"
              description="Organize recipes into beautiful, shareable collections."
            />
            <FeatureCard
              icon={Users}
              title="Community Driven"
              description="Follow chefs, remix recipes, and build your culinary network."
            />
            <FeatureCard
              icon={Sparkles}
              title="Smart Recommendations"
              description="Discover recipes tailored to your taste and dietary needs."
            />
          </div>

          {/* Nickel Allergy Section */}
          <div className="mb-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-recipzee-text mb-1">
                  Built for Nickel Allergy Sufferers
                </h2>
                <p className="text-sm text-recipzee-subtle leading-relaxed">
                  Nickel allergy is one of the most common contact allergies — yet almost no recipe apps recognise it.
                  Recipzee is different. Every recipe can be tagged as <strong className="text-amber-400">Low Nickel</strong>, so you
                  can browse, filter, and cook without second-guessing every ingredient.
                </p>
              </div>
            </div>
            <ul className="grid sm:grid-cols-3 gap-3 text-sm text-recipzee-subtle">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Filter recipes by Low Nickel sensitivity
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Instant allergen scan on every recipe
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Ingredient substitutions for high-nickel foods
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Set your nickel allergy in your profile once
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Community of nickel-conscious cooks
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Share your own low-nickel recipes
              </li>
            </ul>
          </div>

          {/* Platform stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-center mb-12">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-recipzee-text">14</div>
              <div className="text-sm text-recipzee-subtle">Allergens Tracked</div>
            </div>
            <div className="w-px h-10 bg-recipzee-border hidden sm:block" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-recipzee-text">1,400+</div>
              <div className="text-sm text-recipzee-subtle">Ingredient Mappings</div>
            </div>
            <div className="w-px h-10 bg-recipzee-border hidden sm:block" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-recipzee-text">100%</div>
              <div className="text-sm text-recipzee-subtle">Free to Join</div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-12 grid sm:grid-cols-2 gap-4">
            {/* Free tier */}
            <div className="rounded-2xl border border-recipzee-border bg-white/5 p-6">
              <p className="text-sm font-medium text-recipzee-subtle uppercase tracking-wide mb-2">Free</p>
              <p className="text-3xl font-bold text-recipzee-text mb-1">$0</p>
              <p className="text-sm text-recipzee-subtle mb-5">Forever free, no card needed</p>
              <ul className="space-y-2 text-sm text-recipzee-subtle">
                <li className="flex items-center gap-2"><span className="text-recipzee-green">✓</span> Browse & save recipes</li>
                <li className="flex items-center gap-2"><span className="text-recipzee-green">✓</span> Follow chefs & create cookbooks</li>
                <li className="flex items-center gap-2"><span className="text-recipzee-green">✓</span> 3 allergen scans per week</li>
                <li className="flex items-center gap-2"><span className="text-zinc-600">✗</span> Unlimited allergen scans</li>
                <li className="flex items-center gap-2"><span className="text-zinc-600">✗</span> Hide allergens from feed</li>
                <li className="flex items-center gap-2"><span className="text-zinc-600">✗</span> Recipe remixing</li>
              </ul>
            </div>

            {/* Premium tier */}
            <div className="rounded-2xl border border-recipzee-green/40 bg-recipzee-green/5 p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-recipzee-green text-recipzee-dark text-xs font-bold px-3 py-1 rounded-full">7 DAYS FREE</span>
              </div>
              <p className="text-sm font-medium text-recipzee-green uppercase tracking-wide mb-2">Premium</p>
              <p className="text-3xl font-bold text-recipzee-text mb-1">$6.99<span className="text-lg font-normal text-recipzee-subtle">/mo</span></p>
              <p className="text-sm text-recipzee-subtle mb-5">Cancel anytime</p>
              <ul className="space-y-2 text-sm text-recipzee-subtle">
                <li className="flex items-center gap-2"><span className="text-recipzee-green">✓</span> Everything in Free</li>
                <li className="flex items-center gap-2"><span className="text-recipzee-green">✓</span> Unlimited allergen scans</li>
                <li className="flex items-center gap-2"><span className="text-recipzee-green">✓</span> Hide allergens from feed</li>
                <li className="flex items-center gap-2"><span className="text-recipzee-green">✓</span> Recipe remixing</li>
                <li className="flex items-center gap-2"><span className="text-recipzee-green">✓</span> Trending ingredients</li>
              </ul>
              <Link to="/register" className="mt-5 block text-center bg-recipzee-green text-recipzee-dark font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm">
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Footer links */}
          <div className="text-center text-sm text-recipzee-subtle">
            <Link to="/privacy" className="hover:text-recipzee-text transition-colors px-2">
              Privacy
            </Link>
            <span className="text-recipzee-border">•</span>
            <Link to="/terms" className="hover:text-recipzee-text transition-colors px-2">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
