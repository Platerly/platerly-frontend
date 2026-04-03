/**
 * PrivacyPage.jsx
 * Layer: Public / Legal
 *
 * Privacy Policy for Recipzee covering:
 *   - Data collected (account, allergen preferences, recipes, usage, payments)
 *   - How data is used
 *   - Cookies and local storage
 *   - Third-party services (Stripe, Google OAuth, Azure, USDA, Pexels, Sentry)
 *   - Data retention
 *   - User rights (access, correction, deletion, export)
 *   - Children's privacy (13+)
 *   - Changes to policy
 *   - Contact
 */
import React from "react";
import PublicPage from "./PublicPage";

const PrivacyPage = () => (
  <PublicPage
    title="Privacy Policy"
    subtitle="How we collect, use, and protect your data."
  >
    <section className="space-y-10 leading-relaxed text-recipzee-text">

      {/* What we collect */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
        <p className="mb-3">We collect information you provide directly and information generated as you use Recipzee:</p>
        <ul className="list-disc ml-6 space-y-3">
          <li>
            <strong>Account &amp; Profile.</strong> Email address, username, display name, bio,
            and profile image when you register or update your profile. If you sign in with
            Google OAuth, we receive your Google account name and email.
          </li>
          <li>
            <strong>Allergen Preferences.</strong> The allergens you add to your profile
            (e.g., nickel, peanuts, gluten) to power personalized features like "Hide my
            allergens." This data is linked to your account and is never sold.
          </li>
          <li>
            <strong>Recipes &amp; Content.</strong> Recipes, ingredient lists, photos, remixes,
            likes, cookbook collections, comments, and tags you create or interact with.
          </li>
          <li>
            <strong>Usage &amp; Analytics.</strong> Pages visited, features used, referring URLs,
            device type, browser, approximate location (derived from IP address), and session
            duration. We use Google Analytics 4 (GA4) and Meta Pixel for aggregate analytics.
          </li>
          <li>
            <strong>Payment Information.</strong> Subscription status, billing period, and plan
            type. Payments are processed by Stripe — Recipzee never stores full card numbers or
            sensitive payment card data.
          </li>
          <li>
            <strong>Error &amp; Diagnostic Data.</strong> Crash reports, error stack traces, and
            performance metrics collected via Sentry to help us fix bugs and improve reliability.
          </li>
        </ul>
      </div>

      {/* How we use */}
      <div>
        <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Provide, operate, and improve the Recipzee platform and its features.</li>
          <li>Personalize your recipe feed, allergen warnings, and ingredient recommendations based on your preferences.</li>
          <li>Process subscription payments and manage your billing relationship via Stripe.</li>
          <li>Send transactional emails (account confirmation, password reset, billing receipts).</li>
          <li>Diagnose bugs, monitor performance, and fix issues using error and usage data.</li>
          <li>Detect and prevent fraud, abuse, and violations of our Terms of Service.</li>
          <li>Comply with applicable laws and respond to lawful requests from authorities.</li>
        </ul>
      </div>

      {/* Cookies & local storage */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Cookies &amp; Local Storage</h2>
        <p className="mb-3">
          We use browser cookies and local/session storage to support authentication, preferences,
          and analytics. Here is what we use and why:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Authentication tokens</strong> — stored in local storage to keep you signed in across sessions.</li>
          <li><strong>Preference cache</strong> — subscription status, scan quota, and filter settings cached locally to avoid unnecessary API calls (short TTLs, auto-invalidated on changes).</li>
          <li><strong>Session flags</strong> — session storage keys (e.g., first-visit tracking for gated features) that are cleared when you close your browser tab.</li>
          <li><strong>Analytics cookies</strong> — Google Analytics 4 and Meta Pixel set cookies to measure aggregate usage. You can opt out via browser cookie controls or browser-level privacy settings.</li>
        </ul>
        <p className="mt-3">
          You can clear cookies and local storage at any time in your browser settings. Clearing
          auth tokens will sign you out.
        </p>
      </div>

      {/* Third-party services */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
        <p className="mb-3">
          Recipzee uses the following third-party services. Each operates under its own privacy
          policy and data practices:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Stripe</strong> — payment processing and subscription management. Stripe handles and stores all payment card data.</li>
          <li><strong>Google OAuth</strong> — optional "Sign in with Google" authentication. We receive only your name and email from Google when you use this method.</li>
          <li><strong>Microsoft Azure</strong> — cloud hosting, database, and storage infrastructure for the Recipzee backend and data.</li>
          <li><strong>USDA FoodData Central API</strong> — nutritional reference data for ingredients. Queries may include ingredient names; no personal data is sent.</li>
          <li><strong>Pexels</strong> — stock photography used for recipe imagery suggestions. Queries include ingredient or recipe names; no personal data is sent.</li>
          <li><strong>Google Analytics 4 (GA4)</strong> — aggregate usage analytics. Data is pseudonymized and governed by Google's terms.</li>
          <li><strong>Meta Pixel</strong> — aggregate conversion and ad performance measurement. Governed by Meta's data policy.</li>
          <li><strong>Sentry</strong> — error monitoring and crash reporting. Error payloads may include device/browser info and anonymized request context.</li>
        </ul>
        <p className="mt-3">
          We do <strong>not sell</strong> your personal data to third parties.
        </p>
      </div>

      {/* Data sharing */}
      <div>
        <h2 className="text-xl font-semibold mb-3">How We Share Information</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Service Providers.</strong> We share data with the third-party processors listed above under contracts requiring confidentiality and data security.</li>
          <li><strong>Legal &amp; Safety.</strong> We may disclose information when required by law, court order, or to protect the rights, safety, or property of Recipzee, our users, or the public.</li>
          <li><strong>Business Transfers.</strong> If Recipzee is involved in a merger, acquisition, or asset sale, your information may transfer as part of that transaction. We will notify you before your data is transferred to a new entity with a different privacy policy.</li>
        </ul>
      </div>

      {/* Security */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Data Security</h2>
        <p>
          We use industry-standard security measures including HTTPS encryption in transit, hashed
          passwords, access controls, and regular security monitoring. No system is 100% secure.
          If you suspect unauthorized access to your account, please contact us immediately.
        </p>
      </div>

      {/* Retention */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
        <p className="mb-2">
          We retain personal data for as long as your account is active or as needed to provide
          the service. Specifically:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Account and profile data is retained until you delete your account.</li>
          <li>Recipes and user-generated content may remain visible after account deletion unless you explicitly request removal, as they may be part of shared content or remixes.</li>
          <li>Payment records are retained as required for tax, legal, and fraud-prevention purposes (typically 7 years).</li>
          <li>Analytics and diagnostic data is aggregated or deleted within 26 months.</li>
        </ul>
        <p className="mt-2">
          To request account deletion, go to <strong>Settings → Account → Delete Account</strong>{" "}
          or contact us at <a href="mailto:privacy@recipzee.com">privacy@recipzee.com</a>.
        </p>
      </div>

      {/* International transfers */}
      <div>
        <h2 className="text-xl font-semibold mb-3">International Data Transfers</h2>
        <p>
          Recipzee is operated from the United States. If you access the service from another
          country, your data may be transferred to and processed in the US or other countries
          where our service providers operate. We rely on appropriate safeguards (including
          standard contractual clauses where required) for such transfers.
        </p>
      </div>

      {/* Your rights */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
        <p className="mb-2">You have the right to:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Access</strong> the personal data we hold about you.</li>
          <li><strong>Correct</strong> inaccurate or incomplete information in your profile.</li>
          <li><strong>Delete</strong> your account and associated personal data.</li>
          <li><strong>Export</strong> a copy of your data (available via account settings — coming soon).</li>
          <li><strong>Object or restrict</strong> certain processing where permitted by applicable law.</li>
          <li><strong>Withdraw consent</strong> where we rely on consent as a legal basis.</li>
        </ul>
        <p className="mt-2">
          To exercise these rights, email{" "}
          <a
            className="text-recipzee-green hover:underline underline-offset-2"
            href="mailto:privacy@recipzee.com"
          >
            privacy@recipzee.com
          </a>{" "}
          or use our <a href="/contact">contact form</a>. We will respond within 30 days.
        </p>
      </div>

      {/* Children */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
        <p>
          Recipzee is not directed to children under 13 years of age. We do not knowingly collect
          personal information from children under 13. If you believe we have inadvertently
          collected data from a child under 13, please contact us at{" "}
          <a
            className="text-recipzee-green hover:underline underline-offset-2"
            href="mailto:privacy@recipzee.com"
          >
            privacy@recipzee.com
          </a>{" "}
          and we will delete it promptly.
        </p>
      </div>

      {/* Changes */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy to reflect product, legal, or operational changes.
          We will post the updated version here and update the date below. For material changes,
          we will provide additional notice (such as an email or in-app notification) before the
          change takes effect.
        </p>
      </div>

      {/* Contact */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Contact</h2>
        <p>
          Privacy questions, requests, or concerns? Email us at{" "}
          <a
            className="text-recipzee-green hover:underline underline-offset-2"
            href="mailto:privacy@recipzee.com"
          >
            privacy@recipzee.com
          </a>{" "}
          or use our <a href="/contact">contact form</a>.
        </p>
      </div>

      <p className="pt-4 text-sm text-recipzee-subtle">Last updated: April 2, 2026</p>
    </section>
  </PublicPage>
);

export default PrivacyPage;
