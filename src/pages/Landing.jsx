import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { Shield, Sparkles, Users, ChefHat, ArrowRight } from 'lucide-react'

// eslint-disable-next-line no-unused-vars
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
    <div className="shrink-0 w-10 h-10 rounded-lg bg-platerly-green/20 flex items-center justify-center">
      <Icon className="w-5 h-5 text-platerly-green" />
    </div>
    <div>
      <h3 className="font-semibold text-platerly-text">{title}</h3>
      <p className="text-sm text-platerly-subtle mt-0.5">{description}</p>
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
    document.title = 'Platerly — Allergy-aware recipes'
  }, [])

  return (
    <div className="min-h-screen bg-platerly-dark text-platerly-text relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-platerly-green/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="w-full max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-platerly-green/10 border border-platerly-green/20 text-platerly-green text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              The future of recipe sharing
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              Recipes designed for
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-platerly-green to-emerald-400">
                every dietary need
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-platerly-subtle max-w-2xl mx-auto mb-8 leading-relaxed">
              Platerly is the intelligent recipe network that understands your allergies,
              dietary restrictions, and health goals. Share, discover, and cook with confidence.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="min-w-[180px] shadow-lg shadow-platerly-green/20">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>

              <Link to="/login">
                <Button variant="secondary" size="lg" className="min-w-[180px]">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Explore as guest */}
            <div className="mt-6">
              <Link
                to="/feed?tab=explore"
                className="inline-flex items-center gap-1 text-sm text-platerly-subtle hover:text-platerly-text transition-colors"
              >
                Or explore as a guest
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <FeatureCard
              icon={Shield}
              title="Allergy Protection"
              description="Ingredient analysis flags potential allergens in every recipe."
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

          {/* Social proof / Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-center mb-12">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-platerly-text">10K+</div>
              <div className="text-sm text-platerly-subtle">Recipes</div>
            </div>
            <div className="w-px h-10 bg-platerly-border hidden sm:block" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-platerly-text">50+</div>
              <div className="text-sm text-platerly-subtle">Allergens Tracked</div>
            </div>
            <div className="w-px h-10 bg-platerly-border hidden sm:block" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-platerly-text">5K+</div>
              <div className="text-sm text-platerly-subtle">Active Chefs</div>
            </div>
          </div>

          {/* Footer links */}
          <div className="text-center text-sm text-platerly-subtle">
            <Link to="/privacy" className="hover:text-platerly-text transition-colors px-2">
              Privacy
            </Link>
            <span className="text-platerly-border">•</span>
            <Link to="/terms" className="hover:text-platerly-text transition-colors px-2">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
