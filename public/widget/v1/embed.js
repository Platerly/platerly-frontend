/**
 * Recipzee Allergen Ingredient Widget — v1
 *
 * Usage:
 *   <script
 *     src="https://www.recipzee.com/widget/v1/embed.js"
 *     data-config-id="YOUR_CONFIG_ID"
 *     data-api-base="https://api.recipzee.com"
 *     async
 *   ></script>
 *
 * Optional attributes:
 *   data-api-base   — Override the API base URL (default: same origin as the script src)
 *   data-config-id  — Your widget config ID (required for custom branding)
 *
 * The widget mounts itself immediately after the script tag in the DOM.
 */
(function () {
  'use strict';

  var DISCLAIMER =
    'Powered by Recipzee. Nickel data sourced from Rebelytics v9.1.1 \u2014 ' +
    '257 peer-reviewed studies, 20,575 measurements. ' +
    'For informational use only. Not a substitute for professional dietary advice.';

  var DEFAULTS = {
    accentColor: '#22c55e',
    backgroundColor: '#1a1a2e',
    textColor: '#f1f5f9',
    borderColor: '#334155',
    mutedColor: '#94a3b8',
    placeholderText: 'Search for an ingredient\u2026',
    logoUrl: null,
    disclaimer: DISCLAIMER
  };

  // ── Bootstrap ────────────────────────────────────────────────────────────────

  function findCurrentScript() {
    if (document.currentScript) return document.currentScript;
    var scripts = document.querySelectorAll('script[data-config-id]');
    return scripts[scripts.length - 1] || null;
  }

  function deriveApiBase(scriptEl) {
    var override = scriptEl && scriptEl.getAttribute('data-api-base');
    if (override) return override.replace(/\/+$/, '');
    // Derive from script src (e.g. https://www.recipzee.com/widget/v1/embed.js
    //   → https://www.recipzee.com is the frontend, API is same origin)
    if (scriptEl && scriptEl.src) {
      var url = new URL(scriptEl.src);
      return url.origin;
    }
    return window.location.origin;
  }

  function init() {
    var scriptEl = findCurrentScript();
    var configId = scriptEl && scriptEl.getAttribute('data-config-id');
    var apiBase = deriveApiBase(scriptEl);

    // Insert a host div immediately after the script tag
    var host = document.createElement('div');
    host.setAttribute('data-rz-widget-host', '');
    host.style.fontFamily = 'inherit';
    if (scriptEl && scriptEl.parentNode) {
      scriptEl.parentNode.insertBefore(host, scriptEl.nextSibling);
    } else {
      document.body.appendChild(host);
    }

    mountWidget(host, configId, apiBase);
  }

  // ── Widget mount ─────────────────────────────────────────────────────────────

  function mountWidget(host, configId, apiBase) {
    var shadow = host.attachShadow({ mode: 'open' });

    // Show loading skeleton while config fetches
    shadow.innerHTML = buildSkeleton();

    fetchConfig(configId, apiBase).then(function (cfg) {
      shadow.innerHTML = buildHtml(cfg);
      wireEvents(shadow, cfg, apiBase);
    });
  }

  function fetchConfig(configId, apiBase) {
    if (!configId) return Promise.resolve(Object.assign({}, DEFAULTS));
    return fetch(apiBase + '/api/widget/public-config/' + encodeURIComponent(configId))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return Object.assign({}, DEFAULTS);
        return {
          accentColor:     data.accentColor     || DEFAULTS.accentColor,
          backgroundColor: data.backgroundColor || DEFAULTS.backgroundColor,
          textColor:       data.textColor       || DEFAULTS.textColor,
          borderColor:     data.borderColor     || DEFAULTS.borderColor,
          mutedColor:      data.mutedColor      || DEFAULTS.mutedColor,
          placeholderText: data.placeholderText || DEFAULTS.placeholderText,
          logoUrl:         data.logoUrl         || null,
          disclaimer:      data.disclaimer      || DISCLAIMER
        };
      })
      .catch(function () { return Object.assign({}, DEFAULTS); });
  }

  // ── HTML builder ─────────────────────────────────────────────────────────────

  function buildSkeleton() {
    return '<style>:host{display:block}*{box-sizing:border-box}.sk{background:#334155;border-radius:8px;height:48px;animation:pulse 1.4s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}</style><div class="sk"></div>';
  }

  function buildHtml(cfg) {
    var accent = esc(cfg.accentColor);
    var bg     = esc(cfg.backgroundColor);
    var fg     = esc(cfg.textColor);
    var border = esc(cfg.borderColor);
    var muted  = esc(cfg.mutedColor);
    var logo   = cfg.logoUrl
      ? '<img src="' + esc(cfg.logoUrl) + '" alt="Logo" class="rz-logo" />'
      : '';

    return [
      '<style>',
      ':host{display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.5}',
      '*{box-sizing:border-box;margin:0;padding:0}',
      '.rz-widget{background:' + bg + ';border:1px solid ' + border + ';border-radius:16px;padding:16px;max-width:480px}',
      '.rz-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}',
      '.rz-logo{height:24px;width:auto;object-fit:contain}',
      '.rz-brand{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:' + muted + '}',
      '.rz-search-wrap{position:relative}',
      '.rz-input{width:100%;padding:10px 12px 10px 40px;border-radius:12px;border:1px solid ' + border + ';',
      '  background:rgba(255,255,255,.05);color:' + fg + ';font-size:14px;outline:none;transition:border-color .15s}',
      '.rz-input::placeholder{color:' + muted + '}',
      '.rz-input:focus{border-color:' + accent + '}',
      '.rz-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:' + muted + ';pointer-events:none}',
      '.rz-spinner{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;',
      '  border:2px solid ' + accent + ';border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite;display:none}',
      '.rz-spinner.visible{display:block}',
      '@keyframes spin{to{transform:translateY(-50%) rotate(360deg)}}',
      '.rz-results{margin-top:8px}',
      '.rz-result{display:flex;align-items:center;justify-content:space-between;gap:8px;',
      '  padding:10px 12px;border-radius:10px;border:1px solid ' + border + ';margin-bottom:6px;',
      '  background:rgba(255,255,255,.03)}',
      '.rz-result-name{font-size:13px;font-weight:500;color:' + fg + '}',
      '.rz-result-cat{font-size:11px;color:' + muted + ';text-transform:capitalize}',
      '.rz-badge{font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 8px;border-radius:99px;',
      '  border:1px solid;white-space:nowrap;flex-shrink:0}',
      '.rz-low{background:rgba(34,197,94,.12);color:#86efac;border-color:rgba(34,197,94,.3)}',
      '.rz-moderate{background:rgba(245,158,11,.12);color:#fcd34d;border-color:rgba(245,158,11,.3)}',
      '.rz-high{background:rgba(239,68,68,.12);color:#fca5a5;border-color:rgba(239,68,68,.3)}',
      '.rz-unknown{background:rgba(255,255,255,.05);color:' + muted + ';border-color:' + border + '}',
      '.rz-empty{font-size:13px;color:' + muted + ';text-align:center;padding:16px 0}',
      '.rz-disclaimer{font-size:10px;color:' + muted + ';margin-top:10px;line-height:1.5;',
      '  border-top:1px solid ' + border + ';padding-top:8px}',
      '</style>',
      '<div class="rz-widget">',
      '  <div class="rz-header">',
      '    ' + logo,
      '    <span class="rz-brand">Allergen lookup</span>',
      '  </div>',
      '  <div class="rz-search-wrap">',
      '    <svg class="rz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
      '      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
      '    </svg>',
      '    <input id="rz-input" class="rz-input" type="text" autocomplete="off" spellcheck="false"',
      '      placeholder="' + esc(cfg.placeholderText) + '" />',
      '    <div id="rz-spinner" class="rz-spinner"></div>',
      '  </div>',
      '  <div id="rz-results" class="rz-results"></div>',
      '</div>'
    ].join('\n');
  }

  // ── Event wiring ─────────────────────────────────────────────────────────────

  function wireEvents(shadow, cfg, apiBase) {
    var input   = shadow.getElementById('rz-input');
    var results = shadow.getElementById('rz-results');
    var spinner = shadow.getElementById('rz-spinner');
    var timer   = null;

    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value;
      if (!q || q.trim().length < 2) {
        results.innerHTML = '';
        spinner.classList.remove('visible');
        return;
      }
      timer = setTimeout(function () {
        doSearch(q.trim(), results, spinner, cfg, apiBase);
      }, 280);
    });
  }

  function doSearch(query, container, spinner, cfg, apiBase) {
    spinner.classList.add('visible');
    container.innerHTML = '';
    fetch(
      apiBase + '/api/public/ingredients/search?q=' +
      encodeURIComponent(query) + '&limit=8'
    )
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (data) {
        spinner.classList.remove('visible');
        renderResults(container, data, cfg);
      })
      .catch(function () {
        spinner.classList.remove('visible');
        container.innerHTML =
          '<div class="rz-empty">Search unavailable \u2014 please try again.</div>';
      });
  }

  function renderResults(container, items, cfg) {
    if (!items || !items.length) {
      container.innerHTML = '<div class="rz-empty">No results found.</div>';
      return;
    }
    var html = items.map(function (r) {
      var cls = (r.nickelClassification || 'unknown').toLowerCase();
      var label = cls === 'low' ? 'LOW'
        : cls === 'moderate' ? 'MODERATE'
        : cls === 'high' ? 'HIGH'
        : 'UNKNOWN';
      var cat = r.nutritionalCategory
        ? '<div class="rz-result-cat">' + esc(r.nutritionalCategory) + '</div>'
        : '';
      return [
        '<div class="rz-result">',
        '  <div>',
        '    <div class="rz-result-name">' + esc(r.name) + '</div>',
        '    ' + cat,
        '  </div>',
        '  <span class="rz-badge rz-' + esc(cls) + '">' + label + '</span>',
        '</div>'
      ].join('');
    }).join('');

    html += '<div class="rz-disclaimer">' + esc(cfg.disclaimer) + '</div>';
    container.innerHTML = html;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Entry point ──────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
