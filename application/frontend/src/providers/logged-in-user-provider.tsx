import React from "react";
import { createCtx } from "./create-ctx";
import { useCookies } from "react-cookie";
import {
  USER_EMAIL_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";

export type LoggedInUser = {
  displayName: string;
  displayEmail?: string;
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
  const isLoggedInEmail = cookies[USER_EMAIL_COOKIE_NAME];

  const val = isLoggedIn
    ? {
        displayName: isLoggedInName,
        displayEmail: isLoggedInEmail,
      }
    : null;

  return <CtxProvider value={val}>{props.children}</CtxProvider>;
};

export const [useLoggedInUser, CtxProvider] = createCtx<LoggedInUser | null>();

type Props = {
  children: React.ReactNode;
};
