import React from "react";
import { createCtx } from "./create-ctx";
import { DacType } from "../../../backend/src/config/config-schema-dac";
import { useLoggedInUser } from "./logged-in-user-provider";
import { SharerWithStatusType } from "../../../backend/src/business/services/sharers/sharer-service";
import { useTRPC } from "../helpers/trpc-modern.ts";
import { useQuery } from "@tanstack/react-query";

export type LoggedInUserConfigRelay = {
  // the set of datasets currently available from the instance
  datasets: Record<string, string>;

  // the set of sharers currently available from the instance
  sharers: SharerWithStatusType[];

  // the set of DACS currently available from the instance (or [] if this user cannot create releases)
  dacs: DacType[];
};

/**
 * The logged-in user config relay provider delivers values from the API
 * that are available per user - BUT WHICH ARE OTHERWISE NOT GOING TO CHANGE
 * DURING A SESSION. That is, configuration level data that would require a restart
 * of the server are static enough that we can fetch them once on log in.
 *
 * @param props
 * @constructor
 */
export const LoggedInUserConfigRelayProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const trpc = useTRPC();
  const loggedInUser = useLoggedInUser();

  const qSettings = {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
    enabled: !!loggedInUser,
  };

  const datasetsQueryOptions = trpc.dataset.getConfiguredDatasets.queryOptions(
    undefined,
    qSettings,
  );
  const datasetsQuery = useQuery(datasetsQueryOptions);

  const sharersQueryOptions = trpc.sharer.getConfiguredSharers.queryOptions(
    undefined,
    qSettings,
  );
  const sharersQuery = useQuery(sharersQueryOptions);

  const dacQueryOptions = trpc.dac.getConfiguredDacs.queryOptions(
    undefined,
    qSettings,
  );
  const dacQuery = useQuery(dacQueryOptions);

  const val = {
    datasets: datasetsQuery.isSuccess ? datasetsQuery.data : {},
    sharers: sharersQuery.isSuccess ? sharersQuery.data : [],
    dacs: dacQuery.isSuccess ? dacQuery.data : [],
  };

  return <CtxProvider value={val}>{props.children}</CtxProvider>;
};

export const [useLoggedInUserConfigRelay, CtxProvider] =
  createCtx<LoggedInUserConfigRelay | null>();
