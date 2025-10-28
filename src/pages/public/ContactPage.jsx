import React from "react";
import PublicPage from "./PublicPage";

const ContactPage = () => (
  <PublicPage title="Contact" subtitle="We’d love to hear from you.">
    <section className="space-y-6 leading-relaxed text-platerly-text">
      <p>
        For support, partnership inquiries, or legal questions, you can reach our team at:
      </p>

      <p className="text-lg font-medium">
        <a
          href="mailto:support@platerly.com"
          className="text-platerly-green hover:underline underline-offset-2 break-all"
        >
          support@platerly.com
        </a>
      </p>

      <p className="text-sm text-platerly-subtle">
        We aim to respond within 1–2 business days.
      </p>
    </section>
  </PublicPage>
);

export default ContactPage;
