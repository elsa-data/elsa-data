import React from "react";
import axios, { AxiosRequestConfig } from "axios";
import { createCtx } from "./create-ctx";
import { useCookies } from "react-cookie";
import {
  USER_EMAIL_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
  CSRF_TOKEN_COOKIE_NAME,
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
  const [cookies, _setCookie, removeCookie] = useCookies<any>();

  // Removing Cookie when token is no longer valid when using Axios (by 403 Status Code Response).
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
      // we want to send CSRF token with all our internal (Elsa api) requests
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
