/**
 * BotPage.jsx
 * Layer: Public / Transparency
 *
 * Informational page explaining how the Recipzee Bot web crawler works,
 * what data it collects, and how site owners can opt out of indexing.
 *
 * Sections:
 *   - What Recipzee Bot is and how it identifies itself (user-agent string)
 *   - What data the bot collects (title, ingredients, times, og:image, source URL)
 *   - What it never collects (instructions, blog text, author images)
 *   - How indexed recipes appear on Recipzee (discovery layer, not reproduction)
 *   - Benefits for bloggers (qualified traffic, allergen exposure, no SEO impact)
 *   - Robots.txt compliance explanation
 *   - Two opt-out options:
 *       Option 1 — add a robots.txt disallow rule (prevents future crawling)
 *       Option 2 — email removal request (removes existing indexed recipes)
 *   - Contact information
 *
 * Rendered inside PublicPage for consistent layout and styling.
 */
import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import PublicPage from './PublicPage'

/**
 * @returns {JSX.Element}
 */
const BotPage = () => (
  <PublicPage
    title="Recipzee Bot"
    subtitle="The automated indexer that brings halal-verified recipes to Recipzee's explore feed."
  >
    <Helmet>
      <title>Recipzee Bot — How It Works & How to Opt Out</title>
      <meta name="description" content="Learn what Recipzee Bot collects, how it displays your recipes, and how to opt out by adding a single line to your robots.txt." />
      <link rel="canonical" href="https://www.recipzee.com/bot" />
    </Helmet>

    <section className="space-y-12 leading-relaxed text-recipzee-text">

      {/* What it is */}
      <div>
        <h2 className="text-xl font-semibold mb-3">What is Recipzee Bot?</h2>
        <p className="text-recipzee-subtle">
          Recipzee Bot is an automated web crawler that discovers recipes on food blogs and recipe websites.
          It operates on the same principle as Google's crawler and Yummly's indexer — it reads publicly available,
          machine-readable data to build a searchable index of recipes.
        </p>
        <p className="mt-3 text-recipzee-subtle">
          Every recipe Recipzee Bot discovers must pass our{' '}
          <strong className="text-recipzee-text">Halal Gate</strong> — an automated ingredient screen — before
          it enters the index. Non-halal recipes are discarded silently and never stored.
        </p>
        <div className="mt-4 rounded-xl border border-recipzee-green/20 bg-recipzee-green/5 px-5 py-4">
          <p className="text-sm text-recipzee-text font-medium">User agent identifier</p>
          <code className="text-recipzee-green text-sm">Recipzee-Bot/1.0 (+https://recipzee.com/bot)</code>
          <p className="mt-2 text-xs text-recipzee-subtle">
            This is how Recipzee Bot identifies itself in all HTTP requests to your server.
            You will see this string in your access logs.
          </p>
        </div>
      </div>

      {/* What it collects */}
      <div>
        <h2 className="text-xl font-semibold mb-3">What Recipzee Bot collects</h2>
        <ul className="space-y-2 text-recipzee-subtle">
          <li className="flex items-start gap-2">
            <span className="text-recipzee-green mt-0.5 font-bold shrink-0">✓</span>
            <span><strong className="text-recipzee-text">Recipe title</strong> — the name of the dish</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-recipzee-green mt-0.5 font-bold shrink-0">✓</span>
            <span><strong className="text-recipzee-text">Ingredient list</strong> — ingredient names and quantities only</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-recipzee-green mt-0.5 font-bold shrink-0">✓</span>
            <span><strong className="text-recipzee-text">Prep and cook time</strong> — if provided in structured data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-recipzee-green mt-0.5 font-bold shrink-0">✓</span>
            <span><strong className="text-recipzee-text">Cuisine type</strong> — if provided in structured data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-recipzee-green mt-0.5 font-bold shrink-0">✓</span>
            <span><strong className="text-recipzee-text">og:image URL</strong> — the social sharing image you explicitly set, hotlinked directly from your server, never re-hosted</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-recipzee-green mt-0.5 font-bold shrink-0">✓</span>
            <span><strong className="text-recipzee-text">Source URL</strong> — the permanent link back to your original recipe page</span>
          </li>
        </ul>
      </div>

      {/* What it never collects */}
      <div>
        <h2 className="text-xl font-semibold mb-3">What Recipzee Bot never collects</h2>
        <ul className="space-y-2 text-recipzee-subtle">
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5 font-bold shrink-0">✗</span>
            <span><strong className="text-recipzee-text">Cooking instructions</strong> — never stored, never displayed on Recipzee</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5 font-bold shrink-0">✗</span>
            <span><strong className="text-recipzee-text">Blog post text</strong> — personal stories, headnotes, introductions, commentary</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5 font-bold shrink-0">✗</span>
            <span><strong className="text-recipzee-text">Author photos or non-recipe images</strong> — only the og:image is referenced</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5 font-bold shrink-0">✗</span>
            <span><strong className="text-recipzee-text">Any creative writing</strong> — only factual, non-copyrightable ingredient data is extracted</span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-recipzee-subtle">
          Ingredient lists and recipe titles are facts, not creative expression, and are not protected by copyright
          under established case law (see{' '}
          <em>Lambing v. Godiva Chocolatier</em>, <em>Publications Int'l v. Meredith Corp</em>).
          Cooking instructions and personal narratives are yours and yours alone — we never reproduce them.
        </p>
      </div>

      {/* How data is displayed */}
      <div>
        <h2 className="text-xl font-semibold mb-3">How your recipe appears on Recipzee</h2>
        <p className="text-recipzee-subtle mb-3">
          When a user finds your recipe through Recipzee, they see:
        </p>
        <ul className="space-y-2 text-recipzee-subtle">
          <li className="flex items-start gap-2">
            <span className="text-sky-400 mt-0.5 shrink-0">→</span>
            <span>The recipe title and your thumbnail image (linked directly from your server)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-400 mt-0.5 shrink-0">→</span>
            <span>The ingredient list with allergen and nickel safety analysis applied</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-400 mt-0.5 shrink-0">→</span>
            <span>Your domain name, prominently attributed on every card and detail page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-400 mt-0.5 shrink-0">→</span>
            <span>A <strong className="text-recipzee-text">View Full Recipe</strong> button that opens your original page in a new tab</span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-recipzee-subtle">
          Cooking instructions are <strong className="text-recipzee-text">always at your site</strong>.
          Recipzee sends the user to you to actually cook the recipe. We are a discovery layer, not a replacement.
        </p>
      </div>

      {/* How bloggers benefit */}
      <div>
        <h2 className="text-xl font-semibold mb-3">How being indexed benefits you</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Qualified traffic', body: 'Every visitor Recipzee sends to your site is specifically looking for halal recipes or recipes safe for their allergen profile. This is a more targeted audience than general search traffic.' },
            { title: 'Allergen-aware exposure', body: 'Recipzee adds a layer of allergen and nickel safety intelligence to your recipes. Users who filter for "nickel-safe" or "dairy-free" discover your recipes through that lens.' },
            { title: 'No SEO impact', body: 'Recipzee does not reproduce your page. The canonical URL always points to your domain. There is no duplicate content concern.' },
            { title: 'Zero effort', body: 'If you already have Recipe schema markup (JSON-LD) on your site for Google SEO, Recipzee Bot reads the same structured data. Nothing extra to do.' },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-xl border border-recipzee-border bg-white/5 p-4">
              <h3 className="font-semibold text-recipzee-text mb-1">{title}</h3>
              <p className="text-sm text-recipzee-subtle">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Robots.txt respect */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Robots.txt compliance</h2>
        <p className="text-recipzee-subtle">
          Recipzee Bot checks the <code>robots.txt</code> file at the root of every domain before indexing.
          If your robots.txt disallows crawling — either globally or specifically for Recipzee-Bot — we will
          never index your site.
        </p>
        <p className="mt-3 text-recipzee-subtle">
          We re-check robots.txt periodically. If you add a disallow rule after your site has been indexed,
          we will stop indexing new recipes. Removal of already-indexed recipes requires a direct opt-out
          request (see below).
        </p>
      </div>

      {/* How to opt out */}
      <div>
        <h2 className="text-xl font-semibold mb-4">How to opt out</h2>

        <div className="space-y-5">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="font-semibold text-amber-300 mb-2">Option 1 — robots.txt (prevents future indexing)</h3>
            <p className="text-sm text-recipzee-subtle mb-3">
              Add either of these lines to your <code>robots.txt</code> file to prevent Recipzee Bot from
              crawling your site. We check this file before every crawl.
            </p>
            <div className="rounded-lg bg-recipzee-dark border border-recipzee-border p-3 font-mono text-sm text-recipzee-green space-y-1">
              <div># Block only Recipzee Bot:</div>
              <div>User-agent: Recipzee-Bot</div>
              <div>Disallow: /</div>
              <div className="pt-2 text-recipzee-subtle"># Or block all bots:</div>
              <div>User-agent: *</div>
              <div>Disallow: /</div>
            </div>
            <p className="mt-3 text-xs text-recipzee-subtle">
              This stops new indexing immediately. Already-indexed recipes remain until you send a removal
              request (Option 2).
            </p>
          </div>

          <div className="rounded-xl border border-recipzee-green/20 bg-recipzee-green/5 p-5">
            <h3 className="font-semibold text-recipzee-green mb-2">Option 2 — removal request (removes existing recipes)</h3>
            <p className="text-sm text-recipzee-subtle mb-3">
              Email us at{' '}
              <a href="mailto:contact@recipzee.com" className="text-recipzee-green hover:underline">
                contact@recipzee.com
              </a>{' '}
              with the subject line <strong className="text-recipzee-text">"Recipe Removal Request"</strong>.
              Include your domain name. We will:
            </p>
            <ul className="text-sm text-recipzee-subtle space-y-1.5 ml-4">
              <li className="flex items-start gap-2"><span className="text-recipzee-green shrink-0">1.</span> Remove all recipes from your domain within 24 hours</li>
              <li className="flex items-start gap-2"><span className="text-recipzee-green shrink-0">2.</span> Add your domain to our permanent block list</li>
              <li className="flex items-start gap-2"><span className="text-recipzee-green shrink-0">3.</span> Confirm removal by email</li>
            </ul>
            <p className="mt-3 text-xs text-recipzee-subtle">
              Blocklisted domains are never re-indexed, regardless of robots.txt status.
            </p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Contact</h2>
        <p className="text-recipzee-subtle">
          For questions about indexing, removal requests, or anything else:{' '}
          <a href="mailto:contact@recipzee.com" className="text-recipzee-green hover:underline">
            contact@recipzee.com
          </a>
        </p>
        <p className="mt-2 text-recipzee-subtle">
          You can also reach us through the{' '}
          <Link to="/contact" className="text-recipzee-green hover:underline">contact page</Link>.
        </p>
      </div>

    </section>
  </PublicPage>
)

export default BotPage
