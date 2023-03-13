import { Base7807Error } from "@umccr/elsa-types/error-types";

export class NotAuthorisedImportAGDatasets extends Base7807Error {
  constructor(datasetUri?: string) {
    super(
      "Unauthorised attempt to import dataset, or dataset does not exist",
      403,
      `User do not have a role to import dataset${
        datasetUri ? ` for the dataset URI of '${datasetUri}'` : ""
      }.`
    );
  }
}
