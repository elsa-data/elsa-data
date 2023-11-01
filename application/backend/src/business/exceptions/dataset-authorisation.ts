import { Base7807Error } from "@umccr/elsa-types/error-types";

export class NotAuthorisedViewDataset extends Base7807Error {
  constructor(datasetUri?: string) {
    super(
      "Unauthorised attempt to access dataset(s), or dataset(s) does not exist",
      403,
      `User do not have a role to dataset(s)${
        datasetUri ? ` for the datasetUri of '${datasetUri}'` : ""
      }.`,
    );
  }
}

export class NotAuthorisedRefreshDatasetIndex extends Base7807Error {
  constructor(datasetUri?: string) {
    super(
      "Unauthorised attempt to refresh dataset index, or dataset does not exist",
      403,
      `User is not authorise to refresh dataset index${
        datasetUri ? ` for the datasetUri of '${datasetUri}'` : ""
      }.`,
    );
  }
}
