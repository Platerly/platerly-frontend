/**
 * TermsPage.jsx
 * Layer: Public / Legal
 *
 * Terms of Service for Recipzee — covers:
 *   1.  Acceptance of Terms
 *   2.  Service Description
 *   3.  Accounts & Eligibility
 *   4.  Subscription & Billing (consumer + B2B)
 *   5.  Free Trial
 *   6.  B2B API Access
 *   7.  User Content & Licenses
 *   8.  Copyright & IP Complaints
 *   9.  Prohibited Conduct
 *   10. Allergen & Nickel Data Disclaimer
 *   11. Disclaimers (general)
 *   12. Limitation of Liability
 *   13. Indemnification
 *   14. Termination
 *   15. Governing Law & Disputes
 *   16. Changes to These Terms
 *   17. Miscellaneous
 *   18. Contact
 */
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
          By creating an account, accessing the Recipzee API, or browsing public content on
          Recipzee, you agree to these Terms of Service and our{" "}
          <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use Recipzee. These
          Terms form a legally binding agreement between you and Recipzee.
        </p>
      </div>

      {/* 2. Service Description */}
      <div>
        <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
        <p className="mb-2">
          Recipzee is an allergen-aware recipe platform that lets users discover, create, remix,
          and share recipes with awareness of food allergies — including nickel allergy (SNAS).
          We also offer a B2B API for food and health businesses.
        </p>
        <p>
          Features, pricing, and functionality may change over time. We may add, modify, or
          remove features with reasonable notice where practical.
        </p>
      </div>

      {/* 3. Accounts */}
      <div>
        <h2 className="text-xl font-semibold mb-3">3. Accounts &amp; Eligibility</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>You must be at least 13 years old to use Recipzee.</li>
          <li>You must provide accurate registration information and keep your credentials secure.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>You may not share your account credentials with others or create accounts on behalf of someone else without authorization.</li>
          <li>You agree to comply with all applicable laws in your jurisdiction while using Recipzee.</li>
        </ul>
      </div>

      {/* 4. Subscriptions & Billing */}
      <div>
        <h2 className="text-xl font-semibold mb-3">4. Subscriptions &amp; Billing</h2>
        <p className="mb-2">
          Recipzee Premium is a paid subscription billed through Stripe at the price shown at the
          time of purchase. By subscribing, you authorize Stripe to charge your payment method on a
          recurring basis until you cancel.
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
          <li>You can cancel anytime from your account settings. Cancellation takes effect at the end of the current billing period.</li>
          <li>Prices may change with at least 30 days' notice before your next renewal.</li>
          <li>See our <a href="/refunds">Refund &amp; Subscription Policy</a> for details on refunds.</li>
        </ul>
      </div>

      {/* 5. Free Trial */}
      <div>
        <h2 className="text-xl font-semibold mb-3">5. Free Trial</h2>
        <p className="mb-2">
          New users receive a 7-day free trial of Recipzee Premium upon registration. The trial
          gives full access to all Premium features including unlimited allergen scans, recipe
          remixing, and the "Hide my allergens" feed filter.
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>No payment information is required to start a trial.</li>
          <li>Trial access ends automatically after 7 days unless you subscribe.</li>
          <li>Free accounts after the trial are subject to weekly scan limits and feature restrictions.</li>
          <li>We reserve the right to modify or end the trial offer at any time for new users.</li>
        </ul>
      </div>

      {/* 6. B2B API Access */}
      <div>
        <h2 className="text-xl font-semibold mb-3">6. B2B API Access</h2>
        <p className="mb-2">
          Recipzee offers a business API providing access to allergen analytics, ingredient data,
          substitution recommendations, nutritional information, and related endpoints. API access
          is subject to the following additional terms:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>API keys are confidential and must not be shared, published, or committed to public repositories.</li>
          <li>You may not use the API to build a competing service or resell access without a separate written agreement.</li>
          <li>API rate limits apply. Exceeding limits may result in throttling or suspension.</li>
          <li>API data (including nickel content data) is provided for informational and product-development purposes only, not as medical or dietary advice.</li>
          <li>We may modify API endpoints, data schemas, or pricing with reasonable notice.</li>
          <li>B2B accounts are billed according to the plan agreed at the time of API key issuance.</li>
        </ul>
      </div>

      {/* 7. User Content */}
      <div>
        <h2 className="text-xl font-semibold mb-3">7. User Content &amp; Licenses</h2>
        <p className="mb-2">
          You retain ownership of content you post — recipes, photos, notes, and other materials.
          By posting, you grant Recipzee a worldwide, non-exclusive, royalty-free license to host,
          display, store, cache, reproduce, and distribute your content for the purpose of operating,
          promoting, and improving Recipzee.
        </p>
        <p>
          You also grant other users a non-exclusive license to remix your recipes within the
          platform, subject to attribution under our{" "}
          <a href="/guidelines">Community Guidelines</a>. You represent that you have the necessary
          rights to post all content you upload.
        </p>
      </div>

      {/* 8. IP/DMCA */}
      <div>
        <h2 className="text-xl font-semibold mb-3">8. Copyright &amp; IP Complaints</h2>
        <p className="mb-2">
          If you believe your copyright or other intellectual property rights have been infringed,
          please contact us at <a href="mailto:legal@recipzee.com">legal@recipzee.com</a> with
          sufficient detail for us to identify and evaluate the claim.
        </p>
        <p>Do not upload content you do not have the right to share.</p>
      </div>

      {/* 9. Prohibited Conduct */}
      <div>
        <h2 className="text-xl font-semibold mb-3">9. Prohibited Conduct</h2>
        <p className="mb-2">You agree not to:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Post illegal, infringing, hateful, harassing, or deceptive content.</li>
          <li>Scrape, crawl, or bulk-download Recipzee content without written permission.</li>
          <li>Attempt to reverse engineer, decompile, or access systems or source code beyond publicly available APIs.</li>
          <li>Bypass or circumvent rate limits, access controls, or authentication mechanisms.</li>
          <li>Use Recipzee to transmit spam, malware, or unauthorized automated requests.</li>
          <li>Impersonate any person or entity or misrepresent your affiliation.</li>
        </ul>
      </div>

      {/* 10. Allergen & Nickel Disclaimer */}
      <div>
        <h2 className="text-xl font-semibold mb-3">10. Allergen &amp; Nickel Data Disclaimer</h2>
        <p className="mb-2">
          Recipzee includes nickel content data for ingredients, compiled from peer-reviewed
          dietary studies (including Mislankar &amp; Zirwas 2013). This data is provided for
          informational purposes only. It is{" "}
          <strong>not medical or dietary advice</strong> and does not substitute for consultation
          with a qualified healthcare professional or registered dietitian.
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Nickel content in foods can vary significantly based on growing conditions, preparation, and sourcing. Values are estimates based on compiled research.</li>
          <li>Allergen classifications (including user-generated content) may be incomplete or inaccurate.</li>
          <li>Always verify ingredient safety independently if you have a severe or life-threatening allergy.</li>
          <li>Recipzee is not liable for allergic reactions, dietary harm, or health outcomes resulting from reliance on data shown on the platform.</li>
        </ul>
        <p className="mt-2">
          See our <a href="/disclaimer">Allergy &amp; Medical Disclaimer</a> and{" "}
          <a href="/research">Nickel Research &amp; Data Sources</a> for full details.
        </p>
      </div>

      {/* 11. General Disclaimers */}
      <div>
        <h2 className="text-xl font-semibold mb-3">11. Disclaimers</h2>
        <p>
          Recipzee is provided "as is" and "as available." We do not guarantee uninterrupted,
          error-free, or secure service. To the fullest extent permitted by law, we disclaim all
          warranties — express, implied, statutory, or otherwise — including merchantability,
          fitness for a particular purpose, and non-infringement.
        </p>
      </div>

      {/* 12. Limitation of Liability */}
      <div>
        <h2 className="text-xl font-semibold mb-3">12. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Recipzee and its affiliates,
          employees, and licensors will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits, data, goodwill, or business
          opportunities, arising from or related to your use of — or inability to use — the service,
          even if advised of the possibility of such damages. In no event will our total liability
          to you exceed the greater of $100 USD or the amount you paid us in the 12 months
          preceding the claim.
        </p>
      </div>

      {/* 13. Indemnification */}
      <div>
        <h2 className="text-xl font-semibold mb-3">13. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless Recipzee and its affiliates from any
          claims, liabilities, damages, and expenses (including reasonable legal fees) arising from
          your content, your use of the service, your violation of these Terms, or your violation
          of any third-party rights.
        </p>
      </div>

      {/* 14. Termination */}
      <div>
        <h2 className="text-xl font-semibold mb-3">14. Termination</h2>
        <p className="mb-2">
          We may suspend or terminate your access — with or without notice — for violations of
          these Terms, to protect users, our platform, or third parties, or for extended inactivity.
        </p>
        <p>
          You may stop using Recipzee and delete your account at any time from your account
          settings. Provisions that by their nature should survive termination (including IP,
          disclaimers, liability limits, and indemnification) will remain in effect.
        </p>
      </div>

      {/* 15. Governing Law */}
      <div>
        <h2 className="text-xl font-semibold mb-3">15. Governing Law &amp; Disputes</h2>
        <p className="mb-2">
          These Terms are governed by the laws of the United States (and, where applicable, the
          state where Recipzee is incorporated), without regard to conflict-of-law principles.
        </p>
        <p>
          Any dispute arising from these Terms or your use of the service will be resolved through
          binding arbitration on an individual basis, except that either party may seek injunctive
          relief in a court of competent jurisdiction for intellectual property or confidentiality
          matters. You waive any right to participate in a class action. Nothing in this section
          limits rights you may have under applicable consumer protection laws.
        </p>
      </div>

      {/* 16. Changes */}
      <div>
        <h2 className="text-xl font-semibold mb-3">16. Changes to These Terms</h2>
        <p>
          We may update these Terms to reflect product, legal, or operational changes. We will
          update the "Last updated" date below and, for material changes, provide additional
          notice (e.g., email or in-app notification). Continued use after the effective date
          constitutes acceptance of the revised Terms.
        </p>
      </div>

      {/* 17. Miscellaneous */}
      <div>
        <h2 className="text-xl font-semibold mb-3">17. Miscellaneous</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Severability:</strong> If any provision is found unenforceable, the rest remain in full effect.</li>
          <li><strong>Waiver:</strong> Failure to enforce any provision is not a waiver of future enforcement.</li>
          <li><strong>Entire Agreement:</strong> These Terms plus any referenced policies (Privacy Policy, Refund Policy, Community Guidelines) form the complete agreement between you and Recipzee.</li>
          <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent. We may assign ours in connection with a merger, acquisition, or asset sale.</li>
        </ul>
      </div>

      {/* 18. Contact */}
      <div>
        <h2 className="text-xl font-semibold mb-3">18. Contact</h2>
        <p>
          Questions about these Terms?{" "}
          <a href="mailto:legal@recipzee.com">legal@recipzee.com</a> or use our{" "}
          <a href="/contact">contact form</a>.
        </p>
      </div>

      <p className="pt-4 text-sm text-recipzee-subtle">Last updated: April 2, 2026</p>
    </section>
  </PublicPage>
);

export default TermsPage;
