import { DependencyContainer } from "tsyringe";
import { Logger } from "pino";
import { Client } from "edgedb";
import { ElsaSettings } from "./config/elsa-settings";

// our DI framework is limited by javascript/typescript - and so for concrete classes
// needs to use a string based Token mechanism

// this file has some helpers to get back a nicely typed object

/**
 * Return services from the container that don't neatly fit in with container.resolve().
 * So where container.resolve() returns the correct type with no need for a Token, use that.
 * But these concrete classes require both the specification of a type AND a string token
 * and we would like to reduce the boilerplate of that.
 *
 * In general though, DI should be declared in constructors with the pattern and so this
 * function will only be used in limited cases.
 *
 * @inject("Settings") private settings: ElsaSettings,
 *
 * @param dc the dependency container
 */
export function getServices(dc: DependencyContainer) {
  return {
    edgeDbClient: dc.resolve<Client>("Database"),
    settings: dc.resolve<ElsaSettings>("Settings"),
    logger: dc.resolve<Logger>("Logger"),
    features: dc.resolve<ReadonlySet<string>>("Features"),
  };
}
