import React from "react";
import axios, { AxiosRequestConfig } from "axios";
import { createCtx } from "./create-ctx";
import { useCookies } from "react-cookie";
import {
  CSRF_TOKEN_COOKIE_NAME,
  USER_ALLOWED_COOKIE_NAME,
  USER_EMAIL_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import _ from "lodash";

export type LoggedInUser = {
  // a displayable name for the logged-in user
  displayName: string;

  // if present a displayable email for the logged-in user
  displayEmail?: string;

  // the set of UI features that are enabled specifically based on this user permissions
  allowedUi: Set<string>;
};

/**
 * The logged-in user provider is a context that tracks the logged-in user via
 * cookies.
 *
 * @param props
 * @constructor
 */
export const LoggedInUserProvider: React.FC<Props> = (props: Props) => {
  const [cookies, _setCookie, removeCookie] = useCookies<any>([
    CSRF_TOKEN_COOKIE_NAME,
    USER_SUBJECT_COOKIE_NAME,
    USER_NAME_COOKIE_NAME,
    USER_EMAIL_COOKIE_NAME,
    USER_ALLOWED_COOKIE_NAME,
  ]);

  // Removing Cookie when token is no longer valid when using Axios (by 401 Status Code Response).
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const errCode = err?.response?.status;
      if (errCode === 401) {
        removeCookie(USER_SUBJECT_COOKIE_NAME);

        const errMessage = err?.response?.data?.detail;
        if (errMessage) {
          alert(errMessage);
        }
      }

      return Promise.reject(err);
    }
  );

  axios.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      // we want to send CSRF token with all our internal API requests
      if (config.url && config.url.startsWith("/")) {
        if (config.headers) {
          config.headers["csrf-token"] = cookies[CSRF_TOKEN_COOKIE_NAME];
        } else {
          config["headers"] = { "csrf-token": cookies[CSRF_TOKEN_COOKIE_NAME] };
        }
      }
      return config;
    },
    (err) => {
      return Promise.reject(err);
    }
  );

  const isLoggedIn = cookies[USER_SUBJECT_COOKIE_NAME];
  const isLoggedInName = cookies[USER_NAME_COOKIE_NAME];
  const isLoggedInEmail = cookies[USER_EMAIL_COOKIE_NAME];
  const allowedString = cookies[USER_ALLOWED_COOKIE_NAME];

  // if no cookies or any empty value then our allowed is an empty set
  const allowedSet = _.isEmpty(allowedString)
    ? new Set<string>()
    : new Set<string>(allowedString.split(","));

  const val = isLoggedIn
    ? {
        displayName: isLoggedInName,
        displayEmail: isLoggedInEmail,
        allowedUi: allowedSet,
      }
    : null;

  return <CtxProvider value={val}>{props.children}</CtxProvider>;
};

export const [useLoggedInUser, CtxProvider] = createCtx<LoggedInUser | null>();

type Props = {
  children: React.ReactNode;
};
