import React from "react";
import PublicPage from "./PublicPage";

const ContactPage = () => (
  <PublicPage title="Contact" subtitle="We’d love to hear from you.">
    <p>
      For support, press, or legal requests, email
      {" "}
      <a href="mailto:support@platerly.com">support@platerly.com</a>.
    </p>
  </PublicPage>
);

export default ContactPage;