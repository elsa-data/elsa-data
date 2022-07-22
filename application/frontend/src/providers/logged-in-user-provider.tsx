import React from "react";
import { createCtx } from "./create-ctx";
import { useCookies } from "react-cookie";
import {
  SECURE_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
  USER_GROUPS_COOKIE_NAME,
} from "@umccr/elsa-strings";

type LoggedInUser = {
  displayName: string;
};

/**
 * The logged-in user provider is a context that tracks the logged-in user via
 * cookies.
 *
 * @param props
 * @constructor
 */
export const LoggedInUserProvider: React.FC<Props> = (props: Props) => {
  const [cookies] = useCookies<any>([]);

  const isLoggedIn = cookies[USER_SUBJECT_COOKIE_NAME];
  const isLoggedInName = cookies[USER_NAME_COOKIE_NAME];

  const val = isLoggedIn
    ? {
        displayName: isLoggedInName,
      }
    : null;

  return <CtxProvider value={val}>{props.children}</CtxProvider>;
};

export const [useLoggedInUser, CtxProvider] = createCtx<LoggedInUser | null>();

type Props = {
  children: React.ReactNode;
};
