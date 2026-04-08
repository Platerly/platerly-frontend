/**
 * generate-sitemap.js
 *
 * Runs at build time (before `vite build`) to fetch the live sitemap from the
 * backend API and write it to public/sitemap.xml so it is served directly by
 * Azure Static Web Apps at https://recipzee.com/sitemap.xml — no redirects,
 * no cold-start 500s, no cross-domain trust issues for Google.
 *
 * Usage (via package.json build script):
 *   node scripts/generate-sitemap.js && vite build
 *
 * Environment variables:
 *   SITEMAP_API_URL  — override the backend URL (optional, defaults to prod)
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const API_URL =
  process.env.SITEMAP_API_URL ||
  'https://platerly-api-g9htcadmbda6h8ej.canadacentral-01.azurewebsites.net/sitemap.xml'

const OUTPUT_PATH = resolve(__dirname, '../public/sitemap.xml')

console.log(`[sitemap] Fetching from ${API_URL}`)

let xml

try {
  const res = await fetch(API_URL, {
    headers: { Accept: 'application/xml' },
    signal: AbortSignal.timeout(15_000), // 15 s — enough for a cold start
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }

  xml = await res.text()
} catch (err) {
  // Non-fatal: if the backend is unreachable during CI, keep the last committed
  // sitemap rather than breaking the build entirely.
  console.warn(`[sitemap] WARNING: Could not fetch sitemap — ${err.message}`)
  console.warn('[sitemap] Skipping sitemap generation. Existing public/sitemap.xml will be used.')
  process.exit(0)
}

writeFileSync(OUTPUT_PATH, xml, 'utf-8')
console.log(`[sitemap] Written to ${OUTPUT_PATH} (${xml.length} bytes)`)
