import React from "react";
import { createCtx } from "./create-ctx";
import { useCookies } from "react-cookie";
import { CSRF_TOKEN_COOKIE_NAME } from "../../../backend/src/shared/constants-cookies";
import { IsLoadingDiv } from "../components/is-loading-div";
import { useTRPC } from "../helpers/trpc-modern.ts";
import { useQuery } from "@tanstack/react-query";

export type LoggedInUser = {
  id: string;
  subjectIdentifier: string;
  email: string;
  displayName: string;
  // lastLogin?: Date;

  // Write Access
  isAllowedChangeUserPermission: boolean;
  isAllowedRefreshDatasetIndex: boolean;
  isAllowedCreateRelease: boolean;

  // Read Access
  isAllowedOverallAdministratorView: boolean;
};

type Props = {
  children: React.ReactNode;
};
/**
 * The logged-in user provider is a context that tracks the logged-in user via
 * cookies.
 *
 * @param props
 * @constructor
 */
export const LoggedInUserProvider: React.FC<Props> = (props: Props) => {
  const trpc = useTRPC();
  const [cookies] = useCookies<any>([CSRF_TOKEN_COOKIE_NAME]);

  const isLoggedIn = cookies[CSRF_TOKEN_COOKIE_NAME];

  const ownUserQueryOptions = trpc.user.getOwnUser.queryOptions(undefined, {
    enabled: !!isLoggedIn,
  });
  const ownUserQuery = useQuery(ownUserQueryOptions);

  const val =
    isLoggedIn && ownUserQuery.data
      ? {
          ...ownUserQuery.data,
        }
      : null;

  if (isLoggedIn && ownUserQuery.isLoading)
    return (
      <div>
        <IsLoadingDiv />
      </div>
    );

  return <CtxProvider value={val}>{props.children}</CtxProvider>;
};

export const [useLoggedInUser, CtxProvider] = createCtx<LoggedInUser | null>();
