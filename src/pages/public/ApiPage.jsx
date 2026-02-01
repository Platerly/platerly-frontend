import React from "react";
import PublicPage from "./PublicPage";

const ApiPage = () => (
  <PublicPage
    title="Analytics API"
    subtitle="Ingredient intelligence for food businesses."
  >
    <section className="space-y-10 leading-relaxed text-recipzee-text">
      <div>
        <h2 className="text-xl font-semibold mb-3">What We Offer</h2>
        <p className="mb-4">
          The Recipzee Analytics API gives you access to real-time ingredient data
          sourced from our recipe community. Track what people are cooking, discover
          regional trends, and understand dietary shifts as they happen.
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <strong>Trending Ingredients</strong> — See what's gaining popularity
            by region, category, and time period.
          </li>
          <li>
            <strong>Regional Statistics</strong> — Penetration rates, seasonal
            patterns, and common pairings by geography.
          </li>
          <li>
            <strong>Ingredient Pairings</strong> — Co-occurrence data with affinity
            scores and cuisine associations.
          </li>
          <li>
            <strong>Dietary Trends</strong> — Growth rates and market share for
            vegan, keto, halal, gluten-free, and more.
          </li>
          <li>
            <strong>Search Demand</strong> — What users are searching for,
            including unmet demand signals.
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Who It's For</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li><strong>Food brands</strong> — Track ingredient trends and consumer preferences.</li>
          <li><strong>Meal kit companies</strong> — Optimize menus with real demand data.</li>
          <li><strong>Nutritionists & dietitians</strong> — Understand dietary patterns at scale.</li>
          <li><strong>Dietary apps</strong> — Enrich your product with substitution and allergen data.</li>
          <li><strong>Market researchers</strong> — Access food trend intelligence without running surveys.</li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">How It Works</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Authenticate with a secure API key.</li>
          <li>Query RESTful JSON endpoints with flexible filters (region, category, date range).</li>
          <li>Per-key rate limiting with clear usage headers.</li>
          <li>Comprehensive documentation via OpenAPI/Swagger.</li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Get Access</h2>
        <p className="mb-4">
          We're onboarding early partners now. If you're interested in integrating
          Recipzee data into your product or workflow, reach out and we'll get you
          set up.
        </p>
        <p className="text-lg font-medium">
          <a
            href="mailto:api@recipzee.com"
            className="text-recipzee-green hover:underline underline-offset-2 break-all"
          >
            api@recipzee.com
          </a>
        </p>
      </div>
    </section>
  </PublicPage>
);

export default ApiPage;
