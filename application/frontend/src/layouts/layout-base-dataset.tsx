import React from "react";
import { Navigate, Outlet, redirect } from "react-router-dom";
import { useUiAllowed } from "../hooks/ui-allowed";
import {
  ALLOWED_DATASET_UPDATE,
  ALLOWED_OVERALL_ADMIN_VIEW,
} from "@umccr/elsa-constants";

export const DatasetLayout: React.FC = () => {
  const uiAllowed = useUiAllowed();

  if (
    !uiAllowed.has(ALLOWED_DATASET_UPDATE) ||
    !uiAllowed.has(ALLOWED_OVERALL_ADMIN_VIEW)
  ) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
};
