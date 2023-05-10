import React from "react";
import { createCtx } from "./create-ctx";
import { Dac } from "../../../backend/src/config/config-schema-dac";
import { trpc } from "../helpers/trpc";

export type LoggedInUserConfigRelay = {
  // the set of datasets currently available from the instance
  datasets: Record<string, string>;

  // the set of DACS currently available from the instance (or [] if this user cannot create releases)
  dacs: Dac[];
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
export const LoggedInUserConfigRelayProvider: React.FC<Props> = (
  props: Props
) => {
  const datasetsQuery = trpc.datasetRouter.getConfiguredDatasets.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );
  const dacQuery = trpc.dac.getConfiguredDacs.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const val = {
    datasets: datasetsQuery.isSuccess ? datasetsQuery.data : {},
    dacs: dacQuery.isSuccess ? dacQuery.data : [],
  };

  return <CtxProvider value={val}>{props.children}</CtxProvider>;
};

export const [useLoggedInUserConfigRelay, CtxProvider] =
  createCtx<LoggedInUserConfigRelay | null>();

type Props = {
  children: React.ReactNode;
};
