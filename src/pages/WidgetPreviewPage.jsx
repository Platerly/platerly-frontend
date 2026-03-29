import React, { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Code2, Copy, Check, ExternalLink, Paintbrush, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/api'

const DEFAULT_THEME = {
  accentColor: '#22c55e',
  backgroundColor: '#1a1a2e',
  textColor: '#f1f5f9',
  borderColor: '#334155',
  mutedColor: '#94a3b8',
  placeholderText: 'Search for an ingredient…'
}

export default function WidgetPreviewPage() {
  const { token } = useAuth()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE_URL}/api/widget/configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Widget configure requires API key auth — preview uses a special header
        // that maps to the user's dev API key if they have one
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ themeJson: JSON.stringify(theme), maxRecipes: 10 })
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) setConfig(data.data)
        else if (data?.id) setConfig(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleSave = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/widget/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ themeJson: JSON.stringify(theme), maxRecipes: 10 })
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data?.data || data)
        // Reload the preview iframe
        if (iframeRef.current) iframeRef.current.src += ''
      }
    } catch {}
    setSaving(false)
  }

  const scriptTag = config?.scriptTag ||
    `<script src="${window.location.origin}/widget/v1/embed.js" data-config-id="${config?.id || 'YOUR_CONFIG_ID'}" async></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Widget Preview</title>
<style>
  body { background: #0f172a; display: flex; align-items: center; justify-content: center;
         min-height: 100vh; margin: 0; padding: 24px; font-family: sans-serif; }
</style>
</head>
<body>
<script
  src="${window.location.origin}/widget/v1/embed.js"
  data-config-id="${config?.id || ''}"
  data-api-base="${API_BASE_URL}"
  async
></script>
</body>
</html>`

  return (
    <div className="min-h-screen bg-recipzee-dark text-recipzee-text">
      <Helmet>
        <title>Widget Preview — Recipzee</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold mb-2">
            <Code2 className="w-4 h-4" />
            White-Label Widget
          </div>
          <h1 className="text-2xl font-bold mb-1">Allergen Lookup Widget Preview</h1>
          <p className="text-recipzee-muted text-sm">
            Customise the widget appearance, preview it live, then copy the embed code.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── Left: Controls ──────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Theme controls */}
            <div className="rounded-2xl bg-recipzee-card border border-recipzee-border p-5">
              <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                <Paintbrush className="w-4 h-4 text-recipzee-muted" />
                Branding
              </div>
              <div className="space-y-4">
                {[
                  { key: 'accentColor',     label: 'Accent colour',     type: 'color' },
                  { key: 'backgroundColor', label: 'Background colour', type: 'color' },
                  { key: 'textColor',       label: 'Text colour',       type: 'color' },
                  { key: 'borderColor',     label: 'Border colour',     type: 'color' },
                ].map(({ key, label, type }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <label className="text-sm text-recipzee-muted w-36 shrink-0">{label}</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type={type}
                        value={theme[key]}
                        onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                        className="w-9 h-9 rounded-lg border border-recipzee-border cursor-pointer bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={theme[key]}
                        onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-recipzee-dark border border-recipzee-border text-sm text-recipzee-text font-mono focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-recipzee-muted w-36 shrink-0">Placeholder text</label>
                  <input
                    type="text"
                    value={theme.placeholderText}
                    onChange={e => setTheme(t => ({ ...t, placeholderText: e.target.value }))}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-recipzee-dark border border-recipzee-border text-sm text-recipzee-text focus:outline-none focus:border-emerald-500/50"
                    placeholder="Search for an ingredient…"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-5 w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save & refresh preview'}
              </button>
            </div>

            {/* Embed code */}
            <div className="rounded-2xl bg-recipzee-card border border-recipzee-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Embed code</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-recipzee-muted hover:text-recipzee-text transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs font-mono text-emerald-300 bg-recipzee-dark rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all border border-recipzee-border">
                {scriptTag}
              </pre>
              <div className="mt-3 flex items-start gap-2 text-xs text-recipzee-muted">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Paste this anywhere in your HTML. The widget mounts immediately after the script tag.
              </div>
            </div>

            {/* Docs link */}
            <a
              href="/api#widget"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Widget API documentation
            </a>
          </div>

          {/* ── Right: Live preview ─────────────────────────────────────── */}
          <div>
            <div className="rounded-2xl bg-recipzee-card border border-recipzee-border overflow-hidden">
              <div className="px-4 py-3 border-b border-recipzee-border flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="ml-2 text-xs text-recipzee-muted font-mono">preview</span>
              </div>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  title="Widget preview"
                  className="w-full border-0"
                  style={{ height: '340px' }}
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </div>

            <p className="mt-3 text-xs text-recipzee-muted">
              The preview uses the live API — type any ingredient to test real data.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
