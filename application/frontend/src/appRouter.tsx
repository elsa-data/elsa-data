import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  NavLink,
  Outlet,
  Route,
  useLocation,
} from "react-router-dom";
import "./index.css";
import { useLoggedInUser } from "./providers/logged-in-user-provider";
import { EagerErrorBoundary } from "./components/errors";
import AccountPage from "./pages/account-page";
import { UsersDashboardPage } from "./pages/users-dashboard/users-dashboard-page";
import { DacImportPage } from "./pages/dac-import/dac-import-page";
import { ReleasesPage } from "./pages/releases-dashboard/releases-dashboard-page";
import { ReleasesDetailPage } from "./pages/releases/detail/releases-detail-page";
import { AuditEntryPage } from "./pages/releases/detail/logs-box/audit-entry-page";
import DataAccessPage from "./pages/releases/detail/logs-box/data-access-page";
import { DatasetsDashboardPage } from "./pages/datasets-dashboard/datasets-dashboard-page";
import { DatasetsDetailPage } from "./pages/datasets-detail/datasets-detail-page";
import { LayoutBase } from "./layouts/layout-base";
import { Dropdown } from "flowbite-react";
import { LoginDevPage } from "./pages/login-dev-page";
import { NotAuthorisedPage } from "./pages/not-authorised-page";
import { LoginPage } from "./pages/login-page";

export function createAppRouter() {
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
  const ProtectedRoute = ({ redirectPath = "/login" }) => {
    const user = useLoggedInUser();
    if (!user) {
      return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
  };

  const BreadcrumbDropdownItem: React.FC<{ to: string; text: string }> = ({
    to,
    text,
  }) => (
    <NavLink to={to}>
      {({ isActive }) => (
        <Dropdown.Item className={isActive ? "text-gray-200" : "text-gray-500"}>
          {text}
        </Dropdown.Item>
      )}
    </NavLink>
  );

  // there is a bit of duplication here between the breadcrumb dropdown (basically
  // a 'sibling' navigator) - and the actual route definitions further down. Possibly there
  // is a way to automatically compute the routes and we could do a single definition
  const ReleaseBreadcrumbDropdown = () => (
    <>
      <BreadcrumbDropdownItem to="../detail" text="Detail" />
      <BreadcrumbDropdownItem to="../audit-log" text="Audit Log" />
      <BreadcrumbDropdownItem to="../data-access-log" text="Data Access Log" />
      <BreadcrumbDropdownItem to="../user-management" text=" User Management" />
    </>
  );

  return createBrowserRouter(
    createRoutesFromElements(
      <Route path={`/`} element={<LayoutBase />}>
        <Route path={`login`} element={<LoginPage />} />
        {/* a page that we will get to disappear in production deployments */}
        <Route path={`/dev-bm3ey56`} element={<LoginDevPage />} />
        <Route path={`/not-authorised`} element={<NotAuthorisedPage />} />
        <Route path={`/login`} element={<LoginPage />} />

        {/* all routes under here are generally protected (must be logged in) */}
        <Route path={`p`} element={<ProtectedRoute />}>
          <Route path={`account`} element={<AccountPage />} />
          <Route path={`users`} element={<UsersDashboardPage />} />
          <Route path={`dac`} element={<DacImportPage />} />

          <Route path={`datasets`} element={<DatasetsDashboardPage />}>
            <Route path={`:datasetId`} element={<DatasetsDetailPage />} />
          </Route>

          <Route path={`releases`}>
            <Route index element={<ReleasesPage />} />
            <Route
              path={`:releaseId`}
              handle={{
                dropdownItems: () => <ReleaseBreadcrumbDropdown />,
              }}
            >
              <Route
                path={`detail`}
                element={<ReleasesDetailPage />}
                handle={{
                  crumbText: "Detail",
                }}
              />
              <Route
                path={`audit-log`}
                handle={{
                  crumbText: "Audit Log",
                }}
              >
                <Route path={`:objectId`} element={<AuditEntryPage />} />
              </Route>
              <Route
                path={`data-access-log`}
                element={<DataAccessPage />}
                handle={{
                  crumbText: "Data Access Log",
                }}
              />
              <Route
                path={`user-management`}
                // WIP
                element={<DataAccessPage />}
                handle={{
                  crumbText: "User Management",
                }}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NoMatch />} />
      </Route>
    )
  );
}
