import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  useLocation,
} from "react-router-dom";
import "./index.css";
import { useLoggedInUser } from "./providers/logged-in-user-provider";
import { EagerErrorBoundary } from "./components/errors";
import { AccountPage } from "./pages/account-page";
import { UsersDashboardPage } from "./pages/users-dashboard/users-dashboard-page";
import { DacImportPage } from "./pages/dac-import/dac-import-page";
import { ReleasesDashboardPage } from "./pages/releases-dashboard/releases-dashboard-page";
import { ReleasesDetailSubPage } from "./pages/releases/detail/releases-detail-sub-page";
import { DatasetsDashboardPage } from "./pages/datasets-dashboard/datasets-dashboard-page";
import { LayoutBase } from "./layouts/layout-base";
import { LoginDevPage } from "./pages/login-dev-page";
import { NotAuthorisedPage } from "./pages/not-authorised-page";
import { LoginPage } from "./pages/login-page";
import { ReleasesMasterPage } from "./pages/releases/releases-master-page";
import { DataEgressSummarySubPage } from "./pages/releases/data-egress-summary-sub-page/data-egress-summary-sub-page";
import { BulkSelectorSubPage } from "./pages/releases/bulk-selector-sub-page/bulk-selector-sub-page";
import { DatasetsDetailPage } from "./pages/datasets-detail/datasets-detail-page";
import { AuditEventDetailedPage } from "./components/audit-event/audit-event-detailed-page";
import { AuditEventsPage } from "./pages/audit-events-dashboard/audit-events-dashboard-page";
import { ReleasesUserManagementPage } from "./pages/releases/user-management-page/releases-user-management-page";
import { AuditLogSubPage } from "./pages/releases/audit-log-sub-page/audit-log-sub-page";

export function createRouter(addBypassLoginPage: boolean) {
  const NoMatch = () => {
    let location = useLocation();

    return (
      <EagerErrorBoundary
        message={
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

  const releaseChildren = [
    {
      text: "Detail",
      path: "detail",
      element: <ReleasesDetailSubPage />,
      children: <></>,
    },
    {
      text: "Cohort Constructor",
      path: "cohort-constructor",
      element: <BulkSelectorSubPage />,
      children: <></>,
    },
    {
      text: "User Management",
      path: "user-management",
      element: <ReleasesUserManagementPage />,
      children: <></>,
    },
    {
      text: "Data Egress Summary",
      path: "data-egress-summary",
      element: <DataEgressSummarySubPage />,
      children: <></>,
    },
    {
      text: "Audit Log",
      path: "audit-log",
      element: <AuditLogSubPage />,
      children: <></>,
    },
    {
      path: "audit-log/:objectId",
      element: <AuditEventDetailedPage />,
      children: <></>,
    },
  ];

  return createBrowserRouter(
    createRoutesFromElements(
      <Route element={<LayoutBase />}>
        {/* the following 'public' routes need to come first so that they will match before
            the more generic / route */}
        <Route path={`/login`} element={<LoginPage />} />
        <Route path={`/not-authorised`} element={<NotAuthorisedPage />} />

        {/* a login bypass route/page that only appears in dev */}
        {addBypassLoginPage && (
          <Route path={`/dev-bm3ey56`} element={<LoginDevPage />} />
        )}

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
                    to: `./${c.path}`,
                    text: c.text,
                  }))
                  .filter(({ text }) => text !== undefined),
              }}
            >
              <>
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
              </>
            </Route>
          </Route>

          <Route path={`datasets`}>
            <Route index element={<DatasetsDashboardPage />} />
            <Route path={`:datasetUri`} element={<DatasetsDetailPage />} />
          </Route>

          <Route path={`dac`} element={<DacImportPage />} />

          <Route path={`account`} element={<AccountPage />} />
          <Route path={`users`} element={<UsersDashboardPage />} />

          <Route
            path={`audit-events/:objectId`}
            element={<AuditEventDetailedPage />}
          />
          <Route path={`audit-events`} element={<AuditEventsPage />} />
        </Route>

        <Route path="*" element={<NoMatch />} />
      </Route>
    )
  );
}
