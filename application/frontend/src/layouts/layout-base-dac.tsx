import React from "react";
import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { trpc } from "../helpers/trpc";
import { DacType } from "../../../backend/src/config/config-schema-dac";
import { useLoggedInUser } from "../providers/logged-in-user-provider";

export const DacLayout: React.FC = () => {
  const user = useLoggedInUser();

  if (user?.isAllowedCreateRelease) {
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
