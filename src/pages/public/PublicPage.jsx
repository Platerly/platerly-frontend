// src/pages/public/PublicPage.jsx
import React, { useEffect } from 'react'
import Footer from '../../components/Footer'

const PublicPage = ({ title, subtitle, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
    if (title) document.title = `${title} • Recipzee`
  }, [title])

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text flex flex-col">
      {/* Skip link for keyboard users */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 bg-recipzee-card border border-recipzee-border rounded-md px-3 py-2 text-sm shadow outline-none focus:ring-2 focus:ring-recipzee-green/60"
      >
        Skip to content
      </a>

      <main id="content" role="main" className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 md:px-8 py-12 md:py-16">
          {/* Header */}
          <header className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="text-recipzee-green">{title}</span>
            </h1>
            {subtitle && (
              <p className="mt-2 text-base md:text-lg text-recipzee-subtle">
                {subtitle}
              </p>
            )}
          </header>

          {/* Divider (subtle, on-brand) */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-recipzee-border/60 to-transparent mb-6 md:mb-8" />

          {/* Content */}
          <article
            className="
              prose prose-invert max-w-none
              prose-headings:font-semibold
              prose-h2:text-xl md:prose-h2:text-2xl
              prose-h3:text-lg md:prose-h3:text-xl
              prose-a:text-recipzee-green/90 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-recipzee-text
              prose-code:before:hidden prose-code:after:hidden
              prose-code:bg-recipzee-card prose-code:border prose-code:border-recipzee-border prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-li:marker:text-recipzee-text/60
              prose-img:rounded-xl prose-img:border prose-img:border-recipzee-border
            "
          >
            {children}
          </article>
        </section>
      </main>

      {/* Full-width footer on public pages */}
      <div className="pb-[env(safe-area-inset-bottom)]">
        <Footer variant="full" />
      </div>
    </div>
  )
}

export default PublicPage
