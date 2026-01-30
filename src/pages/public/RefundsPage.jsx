import React from "react";
import PublicPage from "./PublicPage";

const RefundsPage = () => (
  <PublicPage
    title="Refund & Subscription Policy"
    subtitle="How billing, cancellations, and refunds work."
  >
    <section className="space-y-10 leading-relaxed text-recipzee-text">
      {/* Billing */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Billing</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Subscriptions are billed monthly via Stripe at the posted price.</li>
          <li>Local taxes may apply based on your region.</li>
          <li>You can view invoices and payment history in <strong>Settings → Billing</strong>.</li>
        </ul>
      </div>

      {/* Renewals & Price Changes */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Renewals & Price Changes</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Plans renew automatically each month until canceled.</li>
          <li>If pricing changes, we’ll provide notice before your next renewal.</li>
        </ul>
      </div>

      {/* Trials (if/when you enable them later) */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Free Trials</h2>
        <p>
          If a free trial is offered, you’ll be charged when the trial ends unless you cancel before the renewal date.
        </p>
      </div>

      {/* Cancellation */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Cancellation</h2>
        <p>
          Cancel anytime from <strong>Settings → Billing</strong>. Your plan remains active
          through the current billing period. You’ll retain access until the period ends.
        </p>
      </div>

      {/* Refunds */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Refunds</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>We generally don’t provide refunds for partial billing periods.</li>
          <li>
            If you believe there’s an error or exceptional circumstance,{" "}
            please contact support within <strong>14 days</strong> of the charge and we’ll review.
          </li>
          <li>Approved refunds are processed back to your original payment method.</li>
        </ul>
      </div>

      {/* Upgrades & Downgrades */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Plan Changes</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Upgrades typically apply immediately; Stripe may prorate the charge.</li>
          <li>Downgrades take effect at the end of your current billing period.</li>
        </ul>
      </div>

      {/* Failed Payments */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Failed Payments</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Stripe will automatically retry failed payments (“dunning”).</li>
          <li>Update your card in <strong>Settings → Billing</strong> to restore access.</li>
          <li>Persistent failures may result in paused or canceled access.</li>
        </ul>
      </div>

      {/* Chargebacks & Abuse */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Chargebacks</h2>
        <p>
          If a chargeback is filed, access may be paused while we review. Please
          <a href="/contact" className="text-recipzee-green hover:underline underline-offset-2"> contact us</a> first so we can help.
        </p>
      </div>

      {/* Contact */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Questions</h2>
        <p>
          We’re here to help. Reach us at{" "}
          <a href="mailto:support@recipzee.com" className="text-recipzee-green hover:underline underline-offset-2">
            support@recipzee.com
          </a>{" "}
          or via our <a href="/contact" className="text-recipzee-green hover:underline underline-offset-2">Contact</a> page.
        </p>
      </div>

      <p className="pt-4 text-sm text-recipzee-subtle">Last updated: Aug 26, 2025</p>
    </section>
  </PublicPage>
);

export default RefundsPage;
