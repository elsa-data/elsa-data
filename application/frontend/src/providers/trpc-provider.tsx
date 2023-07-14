import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../helpers/trpc";
import { CSRF_TOKEN_COOKIE_NAME } from "@umccr/elsa-constants";
import { useShowAlert } from "./show-alert-provider";
import axios, { AxiosRequestConfig } from "axios";

export const TRPCProvider: React.FC<Props> = (props: Props) => {
  const queryClient = new QueryClient({});
  const [cookies, _setCookie, removeCookie] = useCookies<any>();
  const { show } = useShowAlert();

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        async fetch(url, options) {
          const res = await fetch(url, { ...options });

          const errCode = res.status;
          if (errCode === 401) {
            removeCookie(CSRF_TOKEN_COOKIE_NAME);

            const body = await res?.json();

            // This to grab the layout if the error comes from a 'TRPCError'
            let message = body.length > 0 ? body[0]?.error?.message : "";

            // Error could also come from a standard Fastify Error
            if (!message) message = body.title ?? body.detail;

            show({
              description: message,
            });
          }

          return res;
        },
        headers() {
          return {
            "csrf-token": cookies[CSRF_TOKEN_COOKIE_NAME],
          };
        },
      }),
    ],
  });

  // Removing Cookie when token is no longer valid when using Axios (by 401 Status Code Response).
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      const errCode = err?.response?.status;
      if (errCode === 401) {
        removeCookie(CSRF_TOKEN_COOKIE_NAME);

        const errMessage =
          err?.response?.data?.title ?? err?.response?.data?.detail;
        show({
          description: errMessage,
        });
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

  return (
    <>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {/* the query provider comes from react-query and provides standardised remote query semantics */}
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      </trpc.Provider>
    </>
  );
};

type Props = {
  children: React.ReactNode;
};
