import React from "react";
import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { useUiAllowed } from "../hooks/ui-allowed";
import { ALLOWED_CREATE_NEW_RELEASE } from "@umccr/elsa-constants";
import { trpc } from "../helpers/trpc";
import { DacType } from "../../../backend/src/config/config-schema-dac";

export const DacLayout: React.FC = () => {
  const uiAllowed = useUiAllowed();

  if (!uiAllowed.has(ALLOWED_CREATE_NEW_RELEASE)) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
};

/**
 * For use in sub pages for accessing the parent context - in this
 * case a list of DACs configured for this installation.
 */
export function useConfiguredDacs() {
  return useOutletContext<DacType[]>();
}
