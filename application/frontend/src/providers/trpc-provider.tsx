import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../helpers/trpc";
import {
  CSRF_TOKEN_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";

export const TRPCProvider: React.FC<Props> = (props: Props) => {
  const queryClient = new QueryClient({});
  const [cookies, _setCookie, removeCookie] = useCookies<any>();

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        async fetch(url, options) {
          const res = await fetch(url, { ...options });

          const errCode = res.status;
          if (errCode === 401) {
            removeCookie(USER_SUBJECT_COOKIE_NAME);

            const body = await res?.json();
            const message = body.length > 0 ? body[0]?.error?.message : "";
            if (message) alert(message);
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
