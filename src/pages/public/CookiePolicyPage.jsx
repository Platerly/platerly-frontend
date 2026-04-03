/**
 * CookiePolicyPage.jsx
 * Layer: Public / Legal
 *
 * Cookie Policy for Recipzee — covers what cookies and browser storage we use,
 * why we use them, and how visitors can manage or remove them.
 *
 * Linked from:
 *  - CookieConsentBanner ("Cookie policy" link)
 *  - ManageCookiesModal intro paragraph
 *  - Site footer ("Cookies" link)
 *  - PrivacyPage ("Cookies & Local Storage" section)
 */
import React from 'react'
import PublicPage from './PublicPage'

const CookiePolicyPage = () => (
  <PublicPage
    title="Cookie Policy"
    subtitle="What we store in your browser, why, and how to control it."
  >
    <section className="space-y-10 leading-relaxed text-recipzee-text">

      {/* What is a cookie */}
      <div>
        <h2 className="text-xl font-semibold mb-3">What Are Cookies?</h2>
        <p className="mb-3">
          Cookies are small text files placed on your device by a website when you visit it.
          They are widely used to make websites work, to work more efficiently, and to provide
          information to site owners.
        </p>
        <p>
          Recipzee also uses <strong>browser local storage and session storage</strong> — similar
          technologies that store data in your browser rather than in a cookie file but serve the
          same general purpose. In this policy, "cookies" refers to all of these browser-based
          storage mechanisms collectively.
        </p>
      </div>

      {/* Your consent */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Your Consent</h2>
        <p className="mb-3">
          When you first visit Recipzee, we present a consent banner at the bottom of the page.
          You may:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Accept all</strong> — enables all cookie categories including analytics and marketing.</li>
          <li><strong>Reject all</strong> — disables all optional cookies; only essential cookies are set.</li>
          <li><strong>Manage cookies</strong> — opens a panel where you can enable or disable each category individually.</li>
        </ul>
        <p className="mt-3">
          Your choice is stored for 365 days. After that period, or if you clear your browser
          data, we will ask again. You can change your preferences at any time using the{' '}
          <strong>"Manage Cookies"</strong> link in the footer.
        </p>
      </div>

      {/* Essential */}
      <div>
        <h2 className="text-xl font-semibold mb-3">1. Essential Cookies</h2>
        <p className="mb-3">
          These cookies are strictly necessary for Recipzee to function. They cannot be disabled.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-recipzee-border text-recipzee-muted text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4 font-medium">Name / Key</th>
                <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                <th className="text-left py-2 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-recipzee-border/50 text-recipzee-text/90">
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">rz_token</td>
                <td className="py-2.5 pr-4">Authentication JWT — keeps you signed in across sessions.</td>
                <td className="py-2.5">7 days</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">rz_refresh_token</td>
                <td className="py-2.5 pr-4">Refresh token used to silently renew your session without re-logging in.</td>
                <td className="py-2.5">30 days</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">rz_cookie_consent_v1</td>
                <td className="py-2.5 pr-4">Stores your cookie consent decision so the banner does not re-appear on every page load.</td>
                <td className="py-2.5">365 days</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">pl_trial_day8_shown</td>
                <td className="py-2.5 pr-4">Prevents the post-trial expiry modal from showing more than once.</td>
                <td className="py-2.5">Session</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-recipzee-muted">
          All essential storage is local to your browser. None of this data is shared with third parties.
        </p>
      </div>

      {/* Analytics */}
      <div>
        <h2 className="text-xl font-semibold mb-3">2. Analytics Cookies</h2>
        <p className="mb-3">
          Analytics cookies help us understand how visitors interact with Recipzee — which features
          are used, how people navigate, and where we can improve. All data is pseudonymised and
          aggregated before we review it.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-recipzee-border text-recipzee-muted text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4 font-medium">Provider</th>
                <th className="text-left py-2 pr-4 font-medium">Cookie</th>
                <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                <th className="text-left py-2 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-recipzee-border/50 text-recipzee-text/90">
              <tr>
                <td className="py-2.5 pr-4">Google Analytics 4</td>
                <td className="py-2.5 pr-4 font-mono text-xs">_ga, _ga_*</td>
                <td className="py-2.5 pr-4">Distinguishes unique visitors and tracks sessions, pageviews, and custom events (sign-up, scan, upgrade).</td>
                <td className="py-2.5">2 years</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-recipzee-muted">
          Measurement ID: <span className="font-mono">G-EV56P4Q9C0</span>. Data is governed by{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">
            Google's Privacy Policy
          </a>. You can opt out at any time by rejecting analytics cookies here or by installing the{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">
            Google Analytics Opt-out Browser Add-on
          </a>.
        </p>
      </div>

      {/* Marketing */}
      <div>
        <h2 className="text-xl font-semibold mb-3">3. Marketing Cookies</h2>
        <p className="mb-3">
          Marketing cookies allow us to measure the performance of our advertising on third-party
          platforms and to show relevant ads to people who have previously visited Recipzee.
          These cookies are <strong>disabled by default</strong> — they are only activated if you
          explicitly accept them.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-recipzee-border text-recipzee-muted text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4 font-medium">Provider</th>
                <th className="text-left py-2 pr-4 font-medium">Cookie</th>
                <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                <th className="text-left py-2 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-recipzee-border/50 text-recipzee-text/90">
              <tr>
                <td className="py-2.5 pr-4">Meta Pixel</td>
                <td className="py-2.5 pr-4 font-mono text-xs">_fbp, _fbc</td>
                <td className="py-2.5 pr-4">Tracks conversions (registrations, upgrades) from Meta ads. Used to measure ad effectiveness and for retargeting.</td>
                <td className="py-2.5">90 days</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-recipzee-muted">
          Pixel ID: <span className="font-mono">1516646546840356</span>. Data is governed by{' '}
          <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">
            Meta's Privacy Policy
          </a>. You can manage Meta ad preferences at{' '}
          <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">
            facebook.com/ads/preferences
          </a>.
        </p>
      </div>

      {/* Preferences */}
      <div>
        <h2 className="text-xl font-semibold mb-3">4. Preference Storage</h2>
        <p className="mb-3">
          We store a small number of user-interface preferences in your browser's local storage.
          This data <strong>never leaves your device</strong> and is not shared with any third party.
          It exists solely to avoid unnecessary network requests and improve responsiveness.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-recipzee-border text-recipzee-muted text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4 font-medium">Key</th>
                <th className="text-left py-2 pr-4 font-medium">Content</th>
                <th className="text-left py-2 font-medium">TTL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-recipzee-border/50 text-recipzee-text/90">
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">pl_premium_status_v2</td>
                <td className="py-2.5 pr-4">Cached subscription/trial status to avoid refetching on every page.</td>
                <td className="py-2.5">5 minutes</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">pl_scan_status_v1</td>
                <td className="py-2.5 pr-4">Cached weekly allergen scan quota remaining.</td>
                <td className="py-2.5">2 minutes</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs">rz_allergies_v1</td>
                <td className="py-2.5 pr-4">Your allergen profile, cached for the current browser session.</td>
                <td className="py-2.5">Session</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* How to control */}
      <div>
        <h2 className="text-xl font-semibold mb-3">How to Control Cookies</h2>
        <p className="mb-3">You have several options for managing your cookie preferences:</p>
        <ul className="list-disc ml-6 space-y-3">
          <li>
            <strong>Recipzee consent panel</strong> — Click{' '}
            <strong>"Manage Cookies"</strong> in the footer at any time to update your preferences.
          </li>
          <li>
            <strong>Browser settings</strong> — All modern browsers let you block or delete cookies.
            Note that blocking essential cookies will prevent you from signing in.
            See guides for{' '}
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">Chrome</a>,{' '}
            <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">Firefox</a>,{' '}
            <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">Safari</a>.
          </li>
          <li>
            <strong>Google Analytics opt-out</strong> — Install the{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">
              GA Opt-out Browser Add-on
            </a>{' '}
            to prevent GA4 data collection across all sites.
          </li>
          <li>
            <strong>Meta ad preferences</strong> — Visit{' '}
            <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-recipzee-green hover:underline underline-offset-2">
              facebook.com/ads/preferences
            </a>{' '}
            to manage Meta Pixel tracking across all sites.
          </li>
        </ul>
      </div>

      {/* Canadian law */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Canadian Privacy Law</h2>
        <p>
          Recipzee is operated from Canada and complies with PIPEDA (the{' '}
          <em>Personal Information Protection and Electronic Documents Act</em>) and applicable
          provincial privacy legislation. Under PIPEDA, you have the right to know what personal
          information we collect through cookies, why, and how it is used. You may withdraw consent
          at any time by updating your preferences in the panel above or by contacting us at{' '}
          <a href="mailto:privacy@recipzee.com" className="text-recipzee-green hover:underline underline-offset-2">
            privacy@recipzee.com
          </a>.
        </p>
      </div>

      {/* Changes */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy when we add new features or change the cookies we use.
          We will update the date below and notify you of material changes via the consent banner
          or in-app notification.
        </p>
      </div>

      {/* Contact */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Contact</h2>
        <p>
          Questions about our use of cookies? Email us at{' '}
          <a href="mailto:privacy@recipzee.com" className="text-recipzee-green hover:underline underline-offset-2">
            privacy@recipzee.com
          </a>{' '}
          or use our <a href="/contact" className="text-recipzee-green hover:underline underline-offset-2">contact form</a>.
        </p>
      </div>

      <p className="pt-4 text-sm text-recipzee-subtle">Last updated: April 3, 2026</p>
    </section>
  </PublicPage>
)

export default CookiePolicyPage
