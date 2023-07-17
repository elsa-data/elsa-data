import React from "react";
import { Navigate, Outlet, redirect } from "react-router-dom";

import { useLoggedInUser } from "../providers/logged-in-user-provider";

export const DatasetLayout: React.FC = () => {
  const user = useLoggedInUser();

  if (
    user?.isAllowedRefreshDatasetIndex &&
    user?.isAllowedOverallAdministratorView
  ) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
};
