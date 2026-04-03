/**
 * AllergyDisclaimerPage.jsx
 * Layer: Public / Legal
 *
 * Static content page that communicates Recipzee's allergy and medical
 * disclaimer to users. Rendered inside the shared PublicPage shell which
 * handles the page title, header, footer, and prose styling.
 *
 * Key messages:
 *   - Recipzee tools are informational only, not a substitute for
 *     professional medical or dietary advice.
 *   - Ingredient databases may be incomplete; users are responsible
 *     for verifying safety independently.
 *   - Community-submitted recipes do not guarantee allergen accuracy.
 */
import React from "react";
import PublicPage from "./PublicPage";

/**
 * @returns {JSX.Element}
 */
const AllergyDisclaimerPage = () => (
  <PublicPage
    title="Allergy & Medical Disclaimer"
    subtitle="Recipzee provides tools — not medical advice. Always verify ingredients."
  >
    <section className="space-y-4 leading-relaxed text-recipzee-text">
      <p>
        Recipzee includes community-generated recipes, ingredient data, and helpful
        allergy-aware features. While these tools are designed to support safer
        cooking and discovery, they are not substitutes for professional medical or
        dietary guidance.
      </p>

      <p>
        Ingredient sources and food manufacturing practices can change unexpectedly.
        Cross-contact, contamination, and mislabeled products may occur without
        warning. Always verify products independently and consult a qualified
        healthcare professional if you have medical or dietary concerns.
      </p>

      <ul className="list-disc ml-6 space-y-2">
        <li>
          Ingredient databases may be incomplete or inaccurate. Always confirm the
          safety of an ingredient before consuming it.
        </li>
        <li>
          Community-submitted recipes may not reflect personal allergens or medical
          needs. Use Recipzee as guidance, not a guarantee.
        </li>
        <li>
          You are solely responsible for evaluating the safety of any dish or
          product you choose to prepare or consume.
        </li>
      </ul>

      <p className="pt-6 text-sm text-recipzee-subtle">
        Last updated: Aug 26, 2025
      </p>
    </section>
  </PublicPage>
);

export default AllergyDisclaimerPage;
