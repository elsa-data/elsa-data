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
import { ReleasesUserManagementPage } from "./pages/releases/user-management-page/releases-user-management-page";

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

  const BreadcrumbDropdownItem: React.FC<{ to: string; text: string }> = ({
    to,
    text,
  }) => (
    <NavLink to={to}>
      {({ isActive }) => (
        <Dropdown.Item
          className={isActive ? "font-bold text-gray-500" : "text-gray-500"}
        >
          {text}
        </Dropdown.Item>
      )}
    </NavLink>
  );

  const releaseChildren = [
    {
      text: "Detail",
      path: "detail",
      element: <ReleasesDetailPage />,
      children: <></>,
    },
    {
      text: "Data Access Log",
      path: "data-access-log",
      element: <DataAccessPage />,
      children: <></>,
    },
    // TBD Audit Log Page  (
    //         <>
    //           <Route path={`:objectId`} element={<AuditEntryPage />} />
    //         </>
    //       )
    {
      text: "User Management",
      path: "user-management",
      element: <ReleasesUserManagementPage />,
      children: <></>,
    },
  ];

  const ReleaseBreadcrumbDropdown = () => (
    <>
      {releaseChildren.map((c) => (
        <BreadcrumbDropdownItem to={`../${c.path}`} text={c.text} />
      ))}
    </>
  );

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
            <Route index element={<ReleasesPage />} />
            <Route
              path={`:releaseId`}
              handle={{
                dropdownItems: () => <ReleaseBreadcrumbDropdown />,
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

          <Route path={`datasets`} element={<DatasetsDashboardPage />}>
            <Route path={`:datasetId`} element={<DatasetsDetailPage />} />
          </Route>

          <Route path={`dac`} element={<DacImportPage />} />

          <Route path={`account`} element={<AccountPage />} />
          <Route path={`users`} element={<UsersDashboardPage />} />
        </Route>

        <Route path="*" element={<NoMatch />} />
      </Route>
    )
  );
}
