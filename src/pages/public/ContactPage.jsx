import React from "react";
import PublicPage from "./PublicPage";

const ContactPage = () => (
  <PublicPage title="Contact" subtitle="We'd love to hear from you.">
    <section className="space-y-8 leading-relaxed text-recipzee-text">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Support</h2>
          <p className="text-sm text-recipzee-subtle mb-2">
            Account issues, bug reports, or general help.
          </p>
          <a
            href="mailto:support@recipzee.com"
            className="text-recipzee-green hover:underline underline-offset-2 break-all font-medium"
          >
            support@recipzee.com
          </a>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">General Inquiries</h2>
          <p className="text-sm text-recipzee-subtle mb-2">
            Partnerships, press, or business inquiries.
          </p>
          <a
            href="mailto:contact@recipzee.com"
            className="text-recipzee-green hover:underline underline-offset-2 break-all font-medium"
          >
            contact@recipzee.com
          </a>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">API & Data</h2>
          <p className="text-sm text-recipzee-subtle mb-2">
            Interested in our ingredient analytics API? Learn more on our{" "}
            <a href="/api" className="text-recipzee-green hover:underline underline-offset-2">
              API page
            </a>
            , or reach out directly.
          </p>
          <a
            href="mailto:api@recipzee.com"
            className="text-recipzee-green hover:underline underline-offset-2 break-all font-medium"
          >
            api@recipzee.com
          </a>
        </div>
      </div>

      <p className="text-sm text-recipzee-subtle">
        We aim to respond within 1–2 business days.
      </p>
    </section>
  </PublicPage>
);

export default ContactPage;
