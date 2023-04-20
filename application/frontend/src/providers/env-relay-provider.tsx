import React from "react";
import { createCtx } from "./create-ctx";

export type DeployedEnvironments = "production" | "development";

export type EnvRelay = {
  /**
   * The version of this released software. e.g. 1.0.1
   * Though this string should only be used by the front end for
   * display purposes - there is no guarantee that it will always
   * be strictly a semantic version for instance.
   */
  version: string;

  /**
   * The ISO date time of the building of this release software,
   * though this string should only be used by the front end for
   * display purposes - there is no guarantee that it is an ISO
   * parseable time.
   */
  built: string;

  /**
   * The precise source revision used for building this software.
   */
  revision: string;

  deployedEnvironment: DeployedEnvironments;
  terminologyFhirUrl: string;

  /**
   * The string codes for features which are enabled in the base configuration of
   * this particular Elsa Data. For instance - these flags can be used to disable
   * any AWS UI when running in an environment that does not have AWS credentials.
   */
  features: ReadonlySet<string>;
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
