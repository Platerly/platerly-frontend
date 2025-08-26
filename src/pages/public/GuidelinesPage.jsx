import React from "react";
import PublicPage from "./PublicPage";


const GuidelinesPage = () => (
  <PublicPage
    title="Community Guidelines"
    subtitle="Be kind. Credit creators. Cook safely."
  >
    <h2>Respect & Safety</h2>
    <ul>
      <li>No harassment, hate, or discrimination.</li>
      <li>Keep it family‑friendly; no explicit content.</li>
    </ul>

    <h2>Attribution & Remixes</h2>
    <ul>
      <li>Always credit the original recipe when remixing.</li>
      <li>Do not remove watermarks or steal images.</li>
    </ul>

    <h2>Allergy Awareness</h2>
    <ul>
      <li>Tag allergens and use the allergy tools accurately.</li>
      <li>Disclose substitutions and cross‑contact risks when known.</li>
    </ul>

    <h2>Enforcement</h2>
    <p>
      We may remove content or suspend accounts for repeated or severe
      violations. Appeals can be sent via <a href="/contact">Contact</a>.
    </p>

    <p className="mt-8 text-sm text-platerly-subtle">Last updated: Aug 26, 2025</p>
  </PublicPage>
);

export default GuidelinesPage;