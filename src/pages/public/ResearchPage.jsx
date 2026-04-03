/**
 * ResearchPage.jsx
 * Layer: Public / Transparency
 *
 * Showcases the peer-reviewed studies and data sources that underpin
 * Recipzee's nickel tracking features. Intended to establish credibility
 * and transparency with users and healthcare professionals.
 *
 * Key sections:
 *   - Intro — evidence-based positioning
 *   - Primary data source (Rebelytics R&D Inc.)
 *   - Peer-reviewed studies with proper academic citations
 *   - Clinical thresholds used for nickel classification in the app
 *   - Data coverage summary
 *   - Medical disclaimer
 */
import React from "react";
import PublicPage from "./PublicPage";

/**
 * ExternalLink — opens in a new tab with rel="noopener noreferrer".
 */
const ExternalLink = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-recipzee-green/90 hover:underline break-words"
  >
    {children}
  </a>
);

/**
 * CitationCard — a bordered card for a single research citation.
 */
const CitationCard = ({ number, children }) => (
  <div className="flex gap-4 p-4 bg-recipzee-card border border-recipzee-border rounded-lg">
    <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-recipzee-green/10 text-recipzee-green text-sm font-semibold">
      {number}
    </span>
    <div className="text-sm leading-relaxed text-recipzee-text space-y-1">
      {children}
    </div>
  </div>
);

/**
 * ThresholdRow — a single row in the clinical thresholds table.
 */
const ThresholdRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between py-2 border-b border-recipzee-border last:border-0">
    <span className="text-sm text-recipzee-text">{label}</span>
    <span className={`text-sm font-medium ${color}`}>{value}</span>
  </div>
);

const ResearchPage = () => (
  <PublicPage
    title="Research & Data Sources"
    subtitle="Recipzee's nickel tracking is grounded in peer-reviewed science and comprehensive food composition data."
  >
    {/* ── Intro ── */}
    <section className="space-y-4 leading-relaxed text-recipzee-text">
      <p>
        Nickel allergy affects an estimated 10–15% of the population. For people
        with Systemic Nickel Allergy Syndrome (SNAS), managing dietary nickel
        intake is a critical part of symptom control. Recipzee's nickel tracking
        features are built on a foundation of published food composition research
        and clinically validated thresholds — not guesswork.
      </p>
      <p>
        This page documents every data source and study used to build our nickel
        database, and explains how those sources translate into the per-serving
        classifications you see in the app.
      </p>
    </section>

    {/* ── Primary Data Source ── */}
    <section className="mt-10 space-y-4">
      <h2 className="text-xl font-semibold text-recipzee-text">Primary Data Source</h2>

      <div className="p-5 bg-recipzee-card border border-recipzee-green/30 rounded-xl space-y-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-recipzee-green mt-2" />
          <div className="space-y-1">
            <p className="font-semibold text-recipzee-text">
              Rebelytics R&amp;D Inc. — Nickel in Foods Summary Tables v9.1.1
            </p>
            <p className="text-sm text-recipzee-subtle">September 2025</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-recipzee-text">
          A systematic compilation of 257 international food composition studies,
          aggregating <strong>20,575 individual measurements</strong> across{" "}
          <strong>826 unique foods</strong>. This dataset was used to seed the
          nickel content values for <strong>134 foods</strong> across{" "}
          <strong>16 categories</strong> in Recipzee's ingredient database.
        </p>

        <p className="text-sm">
          <ExternalLink href="https://rebelytics.ca/LND/lowNiDiet_r9.1.1_summaryTables.pdf">
            View the full summary tables (PDF) →
          </ExternalLink>
        </p>
      </div>
    </section>

    {/* ── Peer-Reviewed Studies ── */}
    <section className="mt-10 space-y-4">
      <h2 className="text-xl font-semibold text-recipzee-text">Peer-Reviewed Studies</h2>
      <p className="text-sm text-recipzee-subtle leading-relaxed">
        The following published studies inform Recipzee's clinical thresholds,
        dietary guidelines, and individual food nickel values.
      </p>

      <div className="space-y-3">
        <CitationCard number="1">
          <p>
            <strong>Mislankar M, Zirwas MJ.</strong> "Low-nickel diet scoring
            system for systemic nickel allergy."{" "}
            <em>Cutis.</em> 2013;92(1):40–44.{" "}
            <ExternalLink href="https://pubmed.ncbi.nlm.nih.gov/23977692/">
              PMID: 23977692
            </ExternalLink>
          </p>
          <p className="text-recipzee-subtle">
            Primary source for the clinical thresholds used throughout the app
            (daily intake limits and per-serving classifications). See the
            Thresholds section below for full details.
          </p>
        </CitationCard>

        <CitationCard number="2">
          <p>
            <strong>Sharma AD.</strong> "Low nickel diet in dermatology."{" "}
            <em>Indian Journal of Dermatology.</em> 2013;58(3):240.
          </p>
          <p className="text-recipzee-subtle">
            Supporting reference for low-nickel dietary guidelines and food
            avoidance recommendations.
          </p>
        </CitationCard>

        <CitationCard number="3">
          <p>
            <strong>Zirwas MJ, Molenda MA.</strong> "Dietary nickel as a cause
            of systemic contact dermatitis."{" "}
            <em>Journal of Clinical and Aesthetic Dermatology.</em>{" "}
            2009;2(6):39.
          </p>
          <p className="text-recipzee-subtle">
            Foundational paper establishing the link between dietary nickel
            intake and systemic contact dermatitis flares.
          </p>
        </CitationCard>

        <CitationCard number="4">
          <p>
            <strong>Biego GH et al.</strong> (UK cohort study){" "}
            <ExternalLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3667300/">
              PMC3667300
            </ExternalLink>
          </p>
          <p className="text-recipzee-subtle">
            Referenced for lentils, coffee, and tea nickel concentration values
            in the Recipzee ingredient database.
          </p>
        </CitationCard>

        <CitationCard number="5">
          <p>
            <strong>Korean food composition study</strong>
          </p>
          <p className="text-recipzee-subtle">
            Referenced for dark chocolate nickel content (measured at 27.87 mg/kg),
            used to calibrate chocolate and cocoa product entries.
          </p>
        </CitationCard>
      </div>
    </section>

    {/* ── Clinical Thresholds ── */}
    <section className="mt-10 space-y-4">
      <h2 className="text-xl font-semibold text-recipzee-text">Clinical Thresholds</h2>
      <p className="text-sm text-recipzee-subtle leading-relaxed">
        Derived from Mislankar &amp; Zirwas (2013). These thresholds determine
        the colour-coded risk labels shown on recipes and in your daily nickel
        tracker.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Daily intake */}
        <div className="p-4 bg-recipzee-card border border-recipzee-border rounded-xl space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-recipzee-subtle mb-3">
            Daily Intake (SNAS Flare Risk)
          </p>
          <ThresholdRow label="Safe" value="≤ 75 μg/day" color="text-green-400" />
          <ThresholdRow label="Moderate" value="75 – 150 μg/day" color="text-amber-400" />
          <ThresholdRow label="Exceeded" value="> 150 μg/day" color="text-red-400" />
        </div>

        {/* Per-serving */}
        <div className="p-4 bg-recipzee-card border border-recipzee-border rounded-xl space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-recipzee-subtle mb-3">
            Per-Serving Classification
          </p>
          <ThresholdRow label="Low" value="< 10 μg" color="text-green-400" />
          <ThresholdRow label="Moderate" value="10 – 20 μg" color="text-amber-400" />
          <ThresholdRow label="High" value="> 20 μg" color="text-red-400" />
        </div>
      </div>

      <p className="text-sm text-recipzee-subtle leading-relaxed">
        The 150 μg/day figure represents the threshold above which clinical
        trials have observed increased SNAS symptom flares. Individual
        sensitivity varies — some people react below this level, while others
        tolerate higher amounts without symptoms.
      </p>
    </section>

    {/* ── Data Coverage ── */}
    <section className="mt-10 space-y-4">
      <h2 className="text-xl font-semibold text-recipzee-text">Data Coverage</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { stat: "134", label: "Foods tracked" },
          { stat: "16", label: "Categories" },
          { stat: "20,575", label: "Measurements" },
          { stat: "257", label: "Studies compiled" },
        ].map(({ stat, label }) => (
          <div
            key={label}
            className="p-4 bg-recipzee-card border border-recipzee-border rounded-xl text-center"
          >
            <p className="text-2xl font-bold text-recipzee-green">{stat}</p>
            <p className="text-xs text-recipzee-subtle mt-1">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-recipzee-text">
        Categories include: dairy, grains, fruits, vegetables, meats, fish,
        legumes, nuts, chocolate, beverages, fats, and sweeteners, among others.
      </p>

      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm leading-relaxed text-recipzee-subtle">
        <strong className="text-amber-400">Data quality notes:</strong> Spinach
        shows extreme standard deviation across studies, reflecting genuine
        variability in growing conditions and soil nickel content. Peanuts
        similarly exhibit high measurement variability. Values shown in the app
        represent the best available aggregated estimate, not a fixed absolute.
      </div>
    </section>

    {/* ── Disclaimer ── */}
    <section className="mt-10 pt-8 border-t border-recipzee-border">
      <p className="text-sm leading-relaxed text-recipzee-subtle">
        <strong className="text-recipzee-text">Disclaimer:</strong> The
        information on this page, and throughout Recipzee, is provided for
        informational purposes only and does not constitute medical advice.
        Nickel content in foods varies with soil conditions, food processing,
        and preparation methods. Individual tolerance to dietary nickel differs
        significantly. Always consult a qualified allergist or registered
        dietitian before making significant dietary changes based on nickel
        content. Recipzee is not a substitute for professional medical care.
      </p>

      <p className="mt-4 text-xs text-recipzee-subtle">
        Last updated: April 2026
      </p>
    </section>
  </PublicPage>
);

export default ResearchPage;
