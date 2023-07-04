import React from "react";
import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
} from "react-router-dom";
import "./index.css";
import { useLoggedInUser } from "./providers/logged-in-user-provider";
import { EagerErrorBoundary } from "./components/errors";
import { AccountPage } from "./pages/account-page";
import { UsersDashboardPage } from "./pages/users-dashboard/users-dashboard-page";
import { DacDashboardPage } from "./pages/dac-dashboard/dac-dashboard-page";
import { ReleasesDashboardPage } from "./pages/releases-dashboard/releases-dashboard-page";
import { ReleasesDetailSubPage } from "./pages/releases/detail/releases-detail-sub-page";
import { DatasetsDashboardPage } from "./pages/datasets-dashboard/datasets-dashboard-page";
import { LayoutBase } from "./layouts/layout-base";
import { NotAuthorisedPage } from "./pages/not-authorised-page";
import { LoginPage } from "./pages/login-page";
import { ReleasesMasterPage } from "./pages/releases/releases-master-page";
import { DataEgressSummarySubPage } from "./pages/releases/data-egress-summary-sub-page/data-egress-summary-sub-page";
import { BulkSelectorSubPage } from "./pages/releases/bulk-selector-sub-page/bulk-selector-sub-page";
import { DatasetsDetailPage } from "./pages/datasets-detail/datasets-detail-page";
import { AuditEventDetailedPage } from "./components/audit-event/audit-event-detailed-page";
import { AuditEventsPage } from "./pages/audit-events-dashboard/audit-events-dashboard-page";
import { ReleasesUserManagementPage } from "./pages/releases/user-management-page/releases-user-management-page";
import { AuditEventsSubPage } from "./pages/releases/audit-events-sub-page/audit-events-sub-page";
import { JobsSubPage } from "./pages/releases/jobs-sub-page/jobs-sub-page";
import { useUiAllowed } from "./hooks/ui-allowed";
import { DatasetLayout } from "./layouts/layout-base-dataset";
import { DacLayout } from "./layouts/layout-base-dac";
import {
  FEATURE_DEV_TEST_USERS_LOGIN,
  FEATURE_RELEASE_COHORT_CONSTRUCTOR,
  FEATURE_RELEASE_DATA_EGRESS_VIEWER,
} from "@umccr/elsa-constants";

type IndexRouterProps = {
  features: Set<string>;
};

/**
 * Create the complete set of routes for the application.
 *
 * @param features the set of features to enable in the UI
 */
export function IndexRouter({ features }: IndexRouterProps) {
  const NoMatch = () => {
    let location = useLocation();

    return (
      <EagerErrorBoundary
        error={
          <div>
            <p>
              No React router match for <code>{location.pathname}</code>
            </p>
            <p>
              If you have landed on this page by following links within Elsa
              Data - then this is an internal bug and we would be grateful if
              you could report it.
            </p>
            <p>
              If you have just been randomly typing in URLs then you have got
              what you deserved!
            </p>
          </div>
        }
      />
    );
  };
  const ProtectedRoute: React.FC<{ redirectPath: string }> = ({
    redirectPath,
  }) => {
    const user = useLoggedInUser();

    if (!user) {
      return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
  };

  const releaseChildren = [];

  releaseChildren.push({
    text: "Detail",
    path: "detail",
    element: <ReleasesDetailSubPage />,
    children: <></>,
  });

  if (features.has(FEATURE_RELEASE_COHORT_CONSTRUCTOR))
    releaseChildren.push({
      text: "Cohort Constructor",
      path: "cohort-constructor",
      element: <BulkSelectorSubPage />,
      children: <></>,
    });

  releaseChildren.push({
    text: "User Management",
    path: "user-management",
    element: <ReleasesUserManagementPage />,
    children: <></>,
  });

  if (features.has(FEATURE_RELEASE_DATA_EGRESS_VIEWER))
    releaseChildren.push({
      text: "Data Egress Summary",
      path: "data-egress-summary",
      element: <DataEgressSummarySubPage />,
      children: <></>,
    });

  releaseChildren.push({
    text: "Audit Events",
    path: "audit-events",
    element: <AuditEventsSubPage />,
    children: <></>,
  });

  releaseChildren.push({
    text: "Jobs",
    path: "jobs",
    element: <JobsSubPage />,
    children: <></>,
  });

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<LayoutBase />}>
        {/* the following 'public' routes need to come first so that they will match before
            the more generic / route */}
        <Route
          path={`/login`}
          element={
            <LoginPage
              showDevTestLogin={features.has(FEATURE_DEV_TEST_USERS_LOGIN)}
            />
          }
        />
        <Route path={`/not-authorised`} element={<NotAuthorisedPage />} />

        {/* a protected hierarchy of routes - user must be logged in */}
        <Route path={`/`} element={<ProtectedRoute redirectPath="/login" />}>
          {/* our default 'home' is the releases page */}
          <Route index element={<Navigate to={"releases"} />} />

          <Route path={`releases`}>
            <Route index element={<ReleasesDashboardPage />} />

            {/* all pages pertaining to an individual release get this master page which display
                breadcrumbs and some job management UI */}
            <Route
              path={`:releaseKey`}
              element={<ReleasesMasterPage />}
              // we want to pass through to the master page the ability in our breadcrumbs
              // to navigate sideways to our siblings
              handle={{
                siblingItems: releaseChildren
                  .map((c, i) => ({
                    id: c.path,
                    to: `./${c.path}`,
                    text: c.text,
                  }))
                  .filter(({ text }) => text !== undefined),
              }}
            >
              {releaseChildren.map((c, i) => (
                <Route
                  key={i}
                  path={c.path}
                  element={c.element}
                  handle={{
                    crumbText: c.text,
                  }}
                >
                  {c.children}
                </Route>
              ))}
            </Route>
          </Route>

          <Route path={`datasets`}>
            <Route index element={<DatasetsDashboardPage />} />
            <Route path={`:datasetUri`} element={<DatasetLayout />}>
              <Route index element={<DatasetsDetailPage />} />
            </Route>
          </Route>

          <Route path={`dac`} element={<DacLayout />}>
            <Route index element={<DacDashboardPage />} />
          </Route>

          <Route path={`account`} element={<AccountPage />} />
          <Route path={`users`} element={<UsersDashboardPage />} />

          <Route path={`audit-events`} element={<AuditEventsPage />} />

          {/* disabled - need to know how this relates to audit events when we arrive from releases audit page?
              as it turns out - very few audit entries have long details so we don't even need currently
            <Route
            path={`audit-events/:objectId`}
            element={<AuditEventDetailedPage />}
          /> */}
        </Route>

        <Route path="*" element={<NoMatch />} />
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

// Redirection component
const IsDatasetAllowed = () => {
  const uiAllowed = useUiAllowed();

  return <></>;
};
