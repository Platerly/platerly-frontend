import React from "react";
import PublicPage from "./PublicPage";

const AllergyDisclaimerPage = () => (
  <PublicPage
    title="Allergy & Medical Disclaimer"
    subtitle="Platerly is not a medical service. Always verify ingredients."
  >
    <p>
      Platerly provides community‑generated recipes and allergy‑aware features.
      We do not provide medical advice, diagnosis, or treatment. Ingredient data
      may be incomplete or inaccurate. Always verify labels and consult a
      qualified professional for medical or dietary advice.
    </p>
    <ul>
      <li>Cross‑contact and supplier changes can occur without notice.</li>
      <li>
        Use our tools as guidance, not guarantees. You remain responsible for
        your own dietary choices.
      </li>
    </ul>

    <p className="mt-8 text-sm text-platerly-subtle">Last updated: Aug 26, 2025</p>
  </PublicPage>
);

export default AllergyDisclaimerPage;