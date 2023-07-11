import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "../helpers/trpc";
import {
  CSRF_TOKEN_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { useShowAlert } from "./show-alert-provider";

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
            removeCookie(USER_SUBJECT_COOKIE_NAME);

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
