import React from "react";
import PublicPage from "./PublicPage";

const RefundsPage = () => (
  <PublicPage
    title="Refund & Subscription Policy"
    subtitle="How billing, cancellations, and refunds work."
  >
    <h2>Billing</h2>
    <p>Subscriptions are billed monthly via Stripe at the posted price.</p>

    <h2>Cancellation</h2>
    <p>
      Cancel anytime from Settings → Billing. Your plan remains active through
      the current billing period.
    </p>

    <h2>Refunds</h2>
    <p>
      We generally do not offer refunds for partial billing periods. If you
      believe there’s been an error or exceptional circumstance, contact support
      within 14 days.
    </p>

    <h2>Failed Payments</h2>
    <p>Stripe will retry payments. Update your card to restore access.</p>

    <p className="mt-8 text-sm text-platerly-subtle">Last updated: Aug 26, 2025</p>
  </PublicPage>
);

export default RefundsPage;
