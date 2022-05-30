import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { HomePage } from "./pages/landing-page";
import { useAuth } from "react-oidc-context";
import { LayoutNoAuthPage } from "./layouts/layout-noauth-page";
import { ReleasesPage } from "./pages/releases-page";
import { ReleasesSpecificPage } from "./pages/releases-specific-page";
import { DatasetsPage } from "./pages/datasets-page";
import { DatasetsSpecificPage } from "./pages/datasets-specific-page";

function NoMatch() {
  let location = useLocation();

  return (
    <div>
      <p>
        No React router match for <code>{location.pathname}</code>
      </p>
    </div>
  );
}

/**
 * The outer layer of our app including auth, routing, security and any global providers.
 *
 * @constructor
 */
export const App: React.FC = () => {
  const auth = useAuth();

  switch (auth.activeNavigator) {
    case "signinSilent":
      return <div>Signing you in...</div>;
    case "signoutRedirect":
      return <div>Signing you out...</div>;
  }

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>;
  }

  if (true || auth.isAuthenticated) {
    return (
      <Routes>
        <Route path={`/`} element={<HomePage />} />
        <Route path={`/releases`} element={<ReleasesPage />} />
        <Route
          path={`/releases/:releaseId`}
          element={<ReleasesSpecificPage />}
        />
        <Route path={`/datasets`} element={<DatasetsPage />} />
        <Route
          path={`/datasets/:datasetId`}
          element={<DatasetsSpecificPage />}
        />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    );
  }

  return (
    <LayoutNoAuthPage>
      <button
        className="btn btn-blue"
        onClick={() => void auth.signinRedirect()}
      >
        Log in
      </button>
    </LayoutNoAuthPage>
  );
};
