export const PrivacyPage = () => (
  <PublicPage
    title="Privacy Policy"
    subtitle="How we collect, use, and protect your data."
  >
    <h2>Information We Collect</h2>
    <ul>
      <li>Account info (email, username), profile data.</li>
      <li>Content you post (recipes, images, remixes, likes).</li>
      <li>Usage & analytics (cookies, device info, pages viewed).</li>
      <li>Payment metadata via Stripe (Platerly never stores card numbers).</li>
    </ul>

    <h2>How We Use Information</h2>
    <ul>
      <li>Operate and improve Platerly’s features and safety.</li>
      <li>Personalize content and allergy‑aware experiences.</li>
      <li>Communicate updates, security alerts, and support.</li>
    </ul>

    <h2>Sharing</h2>
    <p>
      We share data with processors (e.g., hosting, analytics, payments) under
      contracts. We do not sell personal data.
    </p>

    <h2>Cookies & Tracking</h2>
    <p>
      We use cookies for authentication, preferences, and analytics. You can
      adjust settings in your browser. A cookie banner links to this policy.
    </p>

    <h2>Data Security</h2>
    <p>
      We use industry-standard security (HTTPS, secure cookies, hashed
      passwords). No system is 100% secure.
    </p>

    <h2>Your Rights</h2>
    <ul>
      <li>Access, update, or delete your account data.</li>
      <li>Download your data (coming soon).</li>
      <li>Contact us for privacy questions or concerns.</li>
    </ul>

    <h2>Contact</h2>
    <p>
      Privacy questions? <a href="/contact">Contact us</a>.
    </p>

    <p className="mt-8 text-sm text-platerly-subtle">Last updated: Aug 26, 2025</p>
  </PublicPage>
);