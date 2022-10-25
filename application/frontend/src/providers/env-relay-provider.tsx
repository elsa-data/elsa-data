import React from "react";
import { createCtx } from "./create-ctx";

export type DeployedEnvironments = "production" | "development";

export type EnvRelay = {
  semanticVersion: string;
  buildVersion: string;
  deployedEnvironment: DeployedEnvironments;
  deployedLocation: string;
  terminologyFhirUrl: string;
};

/**
 * The env relay provider is used to provide strongly typed environment variables
 * provided by the backend-html - throughout the React front end.
 *
 * @param props
 * @constructor
 */
export const EnvRelayProvider: React.FC<Props> = (props: Props) => {
  const val = Object.assign({}, props);

  delete val.children;

  return <CtxProvider value={val}>{props.children}</CtxProvider>;
};

export const [useEnvRelay, CtxProvider] = createCtx<EnvRelay>();

type Props = {
  children: React.ReactNode;
} & EnvRelay;
