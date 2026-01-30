import React from "react";
import PublicPage from "./PublicPage";

const TermsPage = () => (
  <PublicPage
    title="Terms of Service"
    subtitle="The rules of using Recipzee. Please read carefully."
  >
    <section className="space-y-10 leading-relaxed text-recipzee-text">
      {/* 1. Acceptance */}
      <div>
        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p>
          By creating an account or browsing public content on Recipzee, you agree to these
          Terms and to our <a href="/privacy">Privacy Policy</a>. If you do not agree, do not
          use Recipzee.
        </p>
      </div>

      {/* 2. Service Description */}
      <div>
        <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
        <p>
          Recipzee is a recipe-sharing social network with allergy-aware features, remixing
          (derivative recipes), and subscription access. Features may evolve over time; we may
          add, modify, or remove functionality.
        </p>
      </div>

      {/* 3. Accounts */}
      <div>
        <h2 className="text-xl font-semibold mb-3">3. Accounts & Eligibility</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>You must provide accurate information and keep credentials secure.</li>
          <li>You are responsible for all activity under your account.</li>
          <li>You must comply with applicable laws where you use Recipzee.</li>
          <li>Recipzee is not directed to children below the age required by your local law.</li>
        </ul>
      </div>

      {/* 4. Content & Licenses */}
      <div>
        <h2 className="text-xl font-semibold mb-3">4. User Content & Licenses</h2>
        <p className="mb-2">
          You retain ownership of content you post (recipes, photos, notes). By posting, you
          grant Recipzee a worldwide, non-exclusive, royalty-free license to host, display,
          store, cache, reproduce, and distribute your content within the service for the
          purpose of operating, promoting, and improving Recipzee.
        </p>
        <p>
          You also grant other users a non-exclusive license to remix your recipes within
          the platform, subject to attribution under our{" "}
          <a href="/guidelines">Community Guidelines</a>. You represent you have the rights
          to post the content you upload.
        </p>
      </div>

      {/* 5. IP/DMCA */}
      <div>
        <h2 className="text-xl font-semibold mb-3">5. Copyright & IP Complaints</h2>
        <p className="mb-2">
          If you believe your copyright or other IP rights are infringed, please contact us at{" "}
          <a href="/contact">Contact</a> with details so we can review and respond
          (e.g., removal or restriction where appropriate).
        </p>
        <p>Do not upload content you do not have permission to share.</p>
      </div>

      {/* 6. Prohibited Conduct */}
      <div>
        <h2 className="text-xl font-semibold mb-3">6. Prohibited Conduct</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Illegal, infringing, hateful, harassing, or deceptive content.</li>
          <li>Posting others’ copyrighted material without permission.</li>
          <li>Scraping, reverse engineering, or disrupting the service or networks.</li>
          <li>Attempting to bypass access controls, rate limits, or security.</li>
        </ul>
      </div>

      {/* 7. Subscriptions */}
      <div>
        <h2 className="text-xl font-semibold mb-3">7. Subscriptions, Billing & Cancellations</h2>
        <p>
          Premium access is billed via Stripe at the posted price. You can cancel anytime to stop
          future billing. See our <a href="/refunds">Refund & Subscription Policy</a> for details.
        </p>
      </div>

      {/* 8. Disclaimers (medical/service) */}
      <div>
        <h2 className="text-xl font-semibold mb-3">8. Disclaimers</h2>
        <p className="mb-2">
          Recipzee is provided “as is.” We do not guarantee uninterrupted or error-free service,
          and we disclaim warranties to the fullest extent permitted by law.
        </p>
        <p>
          Allergy information and ingredient data are community-generated or third-party sourced
          and may be incomplete or inaccurate. Always verify products independently and consult a
          professional for medical or dietary advice. See our{" "}
          <a href="/disclaimer">Allergy & Medical Disclaimer</a>.
        </p>
      </div>

      {/* 9. Limitation of Liability */}
      <div>
        <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Recipzee and its affiliates will not be liable
          for indirect, incidental, special, consequential, or punitive damages, or any loss of
          profits or data, arising from or related to your use of the service.
        </p>
      </div>

      {/* 10. Indemnity */}
      <div>
        <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless Recipzee and its affiliates from
          claims, liabilities, damages, and expenses (including reasonable legal fees) arising
          from your content, your use of the service, or your breach of these Terms.
        </p>
      </div>

      {/* 11. Termination */}
      <div>
        <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
        <p>
          We may suspend or terminate access for violations of these Terms or to protect users,
          our platform, or third parties. You may stop using Recipzee at any time.
        </p>
      </div>

      {/* 12. Governing Law */}
      <div>
        <h2 className="text-xl font-semibold mb-3">12. Governing Law & Disputes</h2>
        <p>
          These Terms are governed by the laws of Ontario, Canada (without regard to conflict-of-law
          principles). Courts in Ontario, Canada shall have exclusive jurisdiction, unless otherwise
          required by applicable consumer law in your region.
        </p>
      </div>

      {/* 13. Changes */}
      <div>
        <h2 className="text-xl font-semibold mb-3">13. Changes to These Terms</h2>
        <p>
          We may update these Terms to reflect product, legal, or operational changes. We’ll update
          the date below and, where appropriate, provide additional notice.
        </p>
      </div>

      {/* 14. Misc */}
      <div>
        <h2 className="text-xl font-semibold mb-3">14. Miscellaneous</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Severability:</strong> If a term is unenforceable, the rest remain in effect.</li>
          <li><strong>Waiver:</strong> A failure to enforce a provision is not a waiver.</li>
          <li><strong>Entire Agreement:</strong> These Terms plus referenced policies form the whole agreement between you and Recipzee.</li>
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h2 className="text-xl font-semibold mb-3">15. Contact</h2>
        <p>
          Questions? <a href="/contact">Contact us</a>.
        </p>
      </div>

      <p className="pt-4 text-sm text-recipzee-subtle">Last updated: Aug 26, 2025</p>
    </section>
  </PublicPage>
);

export default TermsPage;
