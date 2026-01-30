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
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <strong>Account & Profile.</strong> Email, username, display name, bio,
            profile image.
          </li>
          <li>
            <strong>Content.</strong> Recipes, images, remixes, likes, comments, cookbooks, tags.
          </li>
          <li>
            <strong>Usage & Analytics.</strong> Cookies or similar tech, device/browser
            info, pages viewed, referring URLs, approximate location (derived from IP).
          </li>
          <li>
            <strong>Payments.</strong> Subscription status and metadata processed by Stripe.
            <em> Recipzee never stores full card numbers.</em>
          </li>
        </ul>
      </div>

      {/* How we use */}
      <div>
        <h2 className="text-xl font-semibold mb-3">How We Use Information</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Operate, secure, and improve Recipzee’s features and performance.</li>
          <li>Personalize feeds, discovery, and allergy-aware experiences.</li>
          <li>Communicate account updates, service changes, and security alerts.</li>
          <li>Measure engagement and fix bugs (analytics and diagnostics).</li>
          <li>Comply with legal obligations and enforce our terms.</li>
        </ul>
      </div>

      {/* Sharing */}
      <div>
        <h2 className="text-xl font-semibold mb-3">How We Share Information</h2>
        <p className="mb-2">
          We share limited data with service providers (e.g., hosting, analytics,
          email, payments) under contracts requiring confidentiality and security.
          We do <strong>not sell</strong> personal data.
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <strong>Processors.</strong> Cloud hosting, image storage/CDN, error monitoring,
            analytics, email, and Stripe for billing.
          </li>
          <li>
            <strong>Legal & Safety.</strong> We may disclose information to comply with law,
            protect rights, or prevent harm and abuse.
          </li>
          <li>
            <strong>Business Changes.</strong> If we undergo a merger, acquisition, or asset
            sale, your info may transfer as part of that transaction.
          </li>
        </ul>
      </div>

      {/* Cookies */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Cookies & Tracking</h2>
        <p className="mb-2">
          We use cookies and similar technologies for authentication, preferences,
          and analytics. You can adjust cookie settings in your browser. Our cookie
          banner links back to this policy.
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Essential cookies</strong> keep you signed in and secure.</li>
          <li><strong>Analytics cookies</strong> help us understand usage and improve UX.</li>
          <li><strong>Controls:</strong> Browser settings, private browsing, or clearing cookies.</li>
        </ul>
      </div>

      {/* Security */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Data Security</h2>
        <p>
          We use industry-standard measures (HTTPS, secure cookies, hashed passwords,
          access controls). No system is 100% secure; please use a strong,
          unique password and keep it confidential.
        </p>
      </div>

      {/* Retention */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
        <p>
          We keep personal data only as long as necessary for the purposes described
          here (e.g., providing the service, compliance, dispute resolution). We
          anonymize or delete data when it’s no longer needed.
        </p>
      </div>

      {/* International transfers */}
      <div>
        <h2 className="text-xl font-semibold mb-3">International Transfers</h2>
        <p>
          We may process data in countries other than where you live. When we transfer
          data, we use appropriate safeguards (e.g., contractual clauses) as required by law.
        </p>
      </div>

      {/* Your rights */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Access, correct, or delete your account information.</li>
          <li>Download your data (coming soon).</li>
          <li>Object to or restrict certain processing where applicable by law.</li>
          <li>Withdraw consent where we rely on consent.</li>
          <li>
            Lodge a complaint with a supervisory authority, where available in your region.
          </li>
        </ul>
      </div>

      {/* Children */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Children’s Privacy</h2>
        <p>
          Recipzee isn’t directed to children under the age required by your local law.
          If you believe we collected data from a child, please{" "}
          <a className="text-recipzee-green hover:underline underline-offset-2" href="/contact">
            contact us
          </a>{" "}
          and we’ll take appropriate action.
        </p>
      </div>

      {/* Changes */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
        <p>
          We may update this policy to reflect product, legal, or operational changes.
          We’ll post the updated version here and update the date below. For major changes,
          we may provide additional notice.
        </p>
      </div>

      {/* Contact */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Contact</h2>
        <p>
          Privacy questions or requests?{" "}
          <a className="text-recipzee-green hover:underline underline-offset-2" href="/contact">
            Contact us
          </a>.
        </p>
      </div>

      <p className="pt-4 text-sm text-recipzee-subtle">Last updated: Aug 26, 2025</p>
    </section>
  </PublicPage>
);

export default PrivacyPage;
