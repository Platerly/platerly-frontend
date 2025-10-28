import React from "react";
import PublicPage from "./PublicPage";

const NotFoundPage = () => (
  <PublicPage title="404 – Page Not Found" subtitle="This page may have moved or never existed.">
    <section className="space-y-6 leading-relaxed text-platerly-text">
      <p>
        The page you’re trying to reach isn’t available. It may have been removed, renamed,
        or moved during one of our updates.
      </p>

      <p className="text-lg font-medium">
        <a
          href="/"
          className="text-platerly-green hover:underline underline-offset-2"
        >
          Return to Home →
        </a>
      </p>

      <p className="text-sm text-platerly-subtle">
        If you believe this is an error, feel free to reach out via our <a
          href="/contact"
          className="text-platerly-green hover:underline underline-offset-2"
        >
          Contact page
        </a>.
      </p>
    </section>
  </PublicPage>
);

export default NotFoundPage;
