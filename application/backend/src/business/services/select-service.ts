import * as edgedb from "edgedb";
import { dataset, release } from "../../../dbschema/edgeql-js";
import { inject, injectable } from "tsyringe";
import { sleep } from "edgedb/dist/utils";

@injectable()
export class SelectService {
  constructor(@inject("Database") private edgeDbClient: edgedb.Client) {}

  /**
   * For a given chain of specimen->patient->case - use the given consent information
   * to decide if the specimen should be selected for release.
   */
  public async isSelectable(
    applicationContext: release.ApplicationCoded,
    caseContext: dataset.DatasetCase,
    patientContext: dataset.DatasetPatient,
    specimenContext: dataset.DatasetSpecimen
  ): Promise<boolean> {
    const STUPID_STRING_WE_ARE_LOOKING_FOR_IN_ID_FOR_DEMO = "7";

    if (patientContext) {
      if (
        patientContext.externalIdentifiers &&
        patientContext.externalIdentifiers.length > 0
      ) {
        if (patientContext.externalIdentifiers[0].value) {
          if (
            patientContext.externalIdentifiers[0].value.includes(
              STUPID_STRING_WE_ARE_LOOKING_FOR_IN_ID_FOR_DEMO
            )
          )
            return true;
        }
      }
    }

    // this is some fake logic only include specimens where the specimen has two 00 in the sample id
    if (specimenContext) {
      if (
        specimenContext.externalIdentifiers &&
        specimenContext.externalIdentifiers.length > 0
      ) {
        if (specimenContext.externalIdentifiers[0].value) {
          if (specimenContext.externalIdentifiers[0].value.includes("3"))
            await sleep(3000);
          else if (specimenContext.externalIdentifiers[0].value.includes("5"))
            await sleep(5000);

          if (
            specimenContext.externalIdentifiers[0].value.includes(
              STUPID_STRING_WE_ARE_LOOKING_FOR_IN_ID_FOR_DEMO
            )
          )
            return true;
        }
      }
    }

    return false;
  }
}
