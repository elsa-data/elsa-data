import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUiAllowed } from "../hooks/ui-allowed";
import { ALLOWED_CREATE_NEW_RELEASE } from "@umccr/elsa-constants";

export const DacLayout: React.FC = () => {
  const uiAllowed = useUiAllowed();

  if (!uiAllowed.has(ALLOWED_CREATE_NEW_RELEASE)) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
};
