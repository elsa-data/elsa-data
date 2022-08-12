import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { HomePage } from "./pages/landing-page";
import { ReleasesPage } from "./pages/releases/releases-dashboard-page";
import { ReleasesDetailPage } from "./pages/releases/detail/releases-detail-page";
import { DatasetsPage } from "./pages/datasets-page";
import { DatasetsSpecificPage } from "./pages/datasets-specific-page";
import { LoginPage } from "./pages/login-page";
import { useLoggedInUser } from "./providers/logged-in-user-provider";
import { NotAuthorisedPage } from "./pages/not-authorised-page";
import { LoginDevPage } from "./pages/login-dev-page";

function NoMatch() {
  let location = useLocation();

  return (
    <div>
      <p>
        No React router match for <code>{location.pathname}</code>.
      </p>
      <p>
        If you have landed on this page by following links within Elsa Data -
        then this is an internal bug and we would be grateful if you could
        report it.
      </p>
      <p>
        If you have just been randomly typing in URLs then you have got what you
        deserved!
      </p>
    </div>
  );
}

/**
 * The outer layer of our app including auth, routing, security and any global providers.
 */
export const App: React.FC = () => {
  const loggedInUser = useLoggedInUser();

  if (loggedInUser) {
    return (
      <Routes>
        <Route path={`/`} element={<HomePage />} />
        <Route path={`/not-authorised`} element={<NotAuthorisedPage />} />
        <Route path={`/releases`} element={<ReleasesPage />} />
        <Route path={`/releases/:releaseId`} element={<ReleasesDetailPage />} />
        <Route path={`/datasets`} element={<DatasetsPage />} />
        <Route
          path={`/datasets/:datasetId`}
          element={<DatasetsSpecificPage />}
        />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    );
  } else
    return (
      <Routes>
        {/* a page that we will get to disappear in production deployments */}
        <Route path={`/dev-bm3ey56`} element={<LoginDevPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
};
