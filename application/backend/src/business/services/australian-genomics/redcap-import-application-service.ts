import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { makeEmptyCodeArray } from "../../../test-data/test-data-helpers";
import { inject, injectable, singleton } from "tsyringe";
import axios from "axios";
import { RemsApprovedApplicationType } from "@umccr/elsa-types";
import { randomUUID } from "crypto";
import { UsersService } from "../users-service";
import { AuthenticatedUser } from "../../authenticated-user";
import { isEmpty } from "lodash";
import { ElsaSettings } from "../../../config/elsa-settings";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types/csv-australian-genomics";

// we should make this a sensible stable system for the application ids out of Australian Genomics
const AG_REDCAP_URL = "https://mcri.redcap";

@injectable()
@singleton()
export class RedcapImportApplicationService {
  constructor(
    @inject("Database") private edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    private usersService: UsersService
  ) {}

  /**
   * Given an Australian Genomics redcap output CSV file (converted to JSON), we return
   * those rows that are candidates for this Elsa instance = that is we have not already
   * seen this application AND it involves a dataset we control (+ whatever other rules
   * come up)
   *
   * @param csvAsJson an array of converted CSV records straight out of a Redcap export
   */
  public async detectNewReleases(
    csvAsJson: AustraliaGenomicsDacRedcap[]
  ): Promise<AustraliaGenomicsDacRedcap[]> {
    // eventually we might need to put a date range on this but let's see if we can get away
    // with fetching all the release identifiers FOR OUR UNIQUE AG SYSTEM
    const currentReleaseIdentifiers = new Set<string>(
      await e
        .select(e.release.Release, (r) => ({
          applicationDacIdentifier: true,
          filter: e.op(r.applicationDacIdentifier.system, "=", AG_REDCAP_URL),
        }))
        .applicationDacIdentifier.value.run(this.edgeDbClient)
    );

    const results: any[] = [];

    for (const possibleApplication of csvAsJson || []) {
      if (!currentReleaseIdentifiers.has(possibleApplication.daf_num)) {
        results.push(possibleApplication);
      }
    }

    return results;
  }

  public async startNewRelease(
    user: AuthenticatedUser,
    newApplication: AustraliaGenomicsDacRedcap
  ) {
    // TODO: some error checking here

    await this.edgeDbClient.transaction(async (t) => {
      const resourceToDatasetMap: { [uri: string]: string } = {};

      // loop through the resources (datasets) in the application and make sure we are a data holder
      // for them (create a map of dataset id to our edgedb id for that dataset)
      for (const res of []) {
        const remsDatasetUri = res["resource/ext-id"];

        const matchDs = await e
          .select(e.dataset.Dataset, (ds) => ({
            id: true,
            filter: e.op(e.str(remsDatasetUri), "=", ds.uri),
          }))
          .run(this.edgeDbClient);

        if (matchDs && matchDs.length > 0) {
          if (matchDs.length > 1)
            throw new Error(
              `Too many matching datasets on record for ${remsDatasetUri}`
            );
          else resourceToDatasetMap[remsDatasetUri] = matchDs[0].id;
        } else {
          throw new Error(`No matching dataset for ${remsDatasetUri}`);
        }
      }

      // loop through the members (users) mapping to users that we know about
      // TODO: create new users entries for those we don't know yet
      // const memberToUserMap: { [uri: string]: string } = {};

      const newRelease = await e
        .insert(e.release.Release, {
          created: e.datetime_current(),
          applicationDacIdentifier: e.tuple({
            system: AG_REDCAP_URL,
            value: e.str(newApplication.daf_num),
          }),
          applicationDacTitle:
            newApplication.daf_applicant_title || "Untitled in Redcap",
          applicationDacDetails: `
#### Source

This application was sourced from Australian Genomics Redcap on ${Date.now().toLocaleString()}.

#### Summary

${newApplication.daf_public_summ}

##### Created
 
~~~
~~~

##### Applicant
 
~~~
${newApplication.daf_applicant_email}
~~~
`,
          applicationCoded: e.insert(e.release.ApplicationCoded, {
            studyAgreesToPublish: true,
            studyIsNotCommercial: true,
            diseasesOfStudy: makeEmptyCodeArray(),
            countriesInvolved: makeEmptyCodeArray(),
            studyType: "HMB",
          }),
          datasetIndividualUrisOrderPreference: [""],
          datasetSpecimenUrisOrderPreference: [""],
          datasetCaseUrisOrderPreference: [""],
          releaseIdentifier: randomUUID(),
          releasePassword: randomUUID(),
          datasetUris: e.literal(
            e.array(e.str),
            Object.keys(resourceToDatasetMap)
          ),
          // NOTE: this is slightly non-standard as the audit event here is not created as part of the
          // audit service - however this allows us to make it all a single db operation
          // make sure the audit code here keeps in sync with the basic add audit event
          auditLog: e.set(
            e.insert(e.audit.ReleaseAuditEvent, {
              actionCategory: "C",
              actionDescription: "Created Release",
              outcome: 0,
              whoDisplayName: user.displayName,
              whoId: user.subjectId,
              occurredDateTime: e.datetime_current(),
            })
          ),
        })
        .run(this.edgeDbClient);

      await this.usersService.registerRoleInRelease(
        user,
        newRelease.id,
        "DataOwner"
      );
    });
  }
}
