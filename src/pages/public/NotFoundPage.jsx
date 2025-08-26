import React from "react";
import PublicPage from "./PublicPage";

const NotFoundPage = () => (
<PublicPage title="404 – Page Not Found">
<p>
The page you’re looking for doesn’t exist. Head back to the
{" "}
<a href="/">homepage</a>.
</p>
</PublicPage>
);

export default NotFoundPage;