import React from "react";
import PublicPage from "./PublicPage";

const GuidelinesPage = () => (
  <PublicPage
    title="Community Guidelines"
    subtitle="A safe, respectful, and inspiring place to cook and create."
  >
    <section className="space-y-10 leading-relaxed text-recipzee-text">
      {/* Respect & Safety */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Respect & Safety</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>No harassment, hate, or discrimination of any kind.</li>
          <li>Do not post explicit, graphic, or harmful content.</li>
          <li>
            Treat others with kindness and respect — Recipzee is for everyone.
          </li>
        </ul>
      </div>

      {/* Attribution */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Attribution & Remixes</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Always credit the original creator when remixing a recipe.</li>
          <li>
            Do not remove logos, watermarks, or upload images you do not have
            rights to share.
          </li>
          <li>
            Keep remixes honest — add real improvements, variations, or steps.
          </li>
        </ul>
      </div>

      {/* Allergy */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Allergy Awareness</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Use allergy tags responsibly and accurately.</li>
          <li>
            When known, disclose substitutions, processing risks, or
            cross-contact concerns.
          </li>
          <li>
            Do not misrepresent a recipe’s allergy-safety — it's a health risk.
          </li>
        </ul>
      </div>

      {/* Enforcement */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Enforcement</h2>
        <p className="mb-3">
          We may remove content or restrict accounts that repeatedly or severely
          violate these guidelines. Our goal is to maintain a safe, trustworthy,
          and respectful community for everyone.
        </p>
        <p>
          If you believe a decision was incorrect, you can request an appeal at{" "}
          <a
            href="/contact"
            className="text-recipzee-green hover:underline underline-offset-2"
          >
            Contact
          </a>
          .
        </p>
      </div>

      {/* Footer */}
      <p className="pt-8 text-sm text-recipzee-subtle">
        Last updated: Aug 26, 2025
      </p>
    </section>
  </PublicPage>
);

export default GuidelinesPage;
