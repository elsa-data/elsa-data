import React from "react";
import _ from "lodash";
import { createCtx } from "./create-ctx";
import { useCookies } from "react-cookie";
import { CSRF_TOKEN_COOKIE_NAME } from "@umccr/elsa-constants";
import { trpc } from "../helpers/trpc";
import { IsLoadingDiv } from "../components/is-loading-div";

export type LoggedInUser = {
  id: string;
  subjectIdentifier: string;
  email: string;
  displayName: string;
  lastLogin?: Date;

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
  const [cookies] = useCookies<any>([CSRF_TOKEN_COOKIE_NAME]);

  const isLoggedIn = cookies[CSRF_TOKEN_COOKIE_NAME];

  const ownUserQuery = trpc.user.getOwnUser.useQuery(undefined, {
    enabled: !!isLoggedIn,
  });

  const val = ownUserQuery.data
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
