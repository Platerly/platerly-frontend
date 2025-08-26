// src/pages/public/PublicPage.jsx
import React, { useEffect } from 'react'
import Footer from '../../components/Footer'

const PublicPage = ({ title, subtitle, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0)
    if (title) document.title = `${title} • Platerly`
  }, [title])

  return (
    <main className="min-h-screen bg-platerly-dark text-platerly-text flex flex-col">
      <section className="mx-auto max-w-3xl px-4 py-16 flex-1">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-platerly-green">{title}</span>
          </h1>
          {subtitle && <p className="mt-2 text-platerly-subtle text-lg">{subtitle}</p>}
        </header>
        <article className="prose prose-invert prose-headings:font-semibold prose-a:text-platerly-green/90 prose-a:no-underline hover:prose-a:underline">
          {children}
        </article>
      </section>

      {/* full-width footer on public pages */}
      <Footer variant="full" />
    </main>
  )
}

export default PublicPage
