import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { makeEmptyCodeArray } from "../../../test-data/util/test-data-helpers";
import { inject, injectable } from "tsyringe";
import {
  australianGenomicsDacRedcapToDatasetUris,
  australianGenomicsDacRedcapToDuoString,
} from "@umccr/elsa-types";
import { UserService } from "../user-service";
import { AuthenticatedUser } from "../../authenticated-user";
import { ElsaSettings } from "../../../config/elsa-settings";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types/csv-australian-genomics";
import { format } from "date-fns";
import { getNextReleaseKey } from "../../db/release-queries";
import { ReleaseService } from "../release-service";
import {
  ApplicationUser,
  checkValidApplicationUser,
  insertPotentialOrReal,
} from "../_dac-user-helper";

// we should make this a sensible stable system for the application ids out of Australian Genomics
const AG_REDCAP_URL = "https://redcap.mcri.edu.au";

@injectable()
export class RedcapImportApplicationService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject(UserService) private readonly userService: UserService,
    @inject(ReleaseService) private readonly releaseService: ReleaseService
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
    user: AuthenticatedUser,
    csvAsJson: AustraliaGenomicsDacRedcap[]
  ): Promise<AustraliaGenomicsDacRedcap[]> {
    this.releaseService.checkIsAllowedViewReleases(user);

    // eventually we might need to put a date range on this but let's see if we can get away
    // with fetching all the release identifiers FOR OUR UNIQUE AG SYSTEM
    const currentReleaseKeys = new Set<string>(
      await e
        .select(e.release.Release, (r) => ({
          applicationDacIdentifier: true,
          filter: e.op(r.applicationDacIdentifier.system, "=", AG_REDCAP_URL),
        }))
        .applicationDacIdentifier.value.run(this.edgeDbClient)
    );

    const results: AustraliaGenomicsDacRedcap[] = [];

    for (const possibleApplication of csvAsJson || []) {
      if (!currentReleaseKeys.has(possibleApplication.daf_num)) {
        results.push(possibleApplication);
      }
    }

    return results;
  }

  /**
   * Given a new application as a CSV/JSON object - we create a new release
   * representing it in a transaction.
   *
   * @param user
   * @param newApplication
   * @return the release id of the new release
   */
  public async startNewRelease(
    user: AuthenticatedUser,
    newApplication: AustraliaGenomicsDacRedcap
  ): Promise<string> {
    this.releaseService.checkIsAllowedCreateReleases(user);
    // TODO: some error checking here of the incoming application data

    const newRelease = await this.edgeDbClient.transaction(async (t) => {
      const resourceUris =
        australianGenomicsDacRedcapToDatasetUris(newApplication);

      const resourceToDatasetMap: { [uri: string]: string } = {};

      // loop through the resources (datasets) in the application and make sure we are a data holder
      // for them (create a map of dataset id to our edgedb id for that dataset)
      for (const resourceUri of resourceUris) {
        // do we have that dataset registered in our Elsa Data
        const matchDs = await e
          .select(e.dataset.Dataset, (ds) => ({
            id: true,
            filter: e.op(e.str(resourceUri), "=", ds.uri),
          }))
          .run(this.edgeDbClient);

        if (matchDs && matchDs.length > 0) {
          if (matchDs.length > 1)
            throw new Error(
              `Too many matching datasets on record for ${resourceUri}`
            );
          else resourceToDatasetMap[resourceUri] = matchDs[0].id;
        } else {
          throw new Error(`No matching dataset for ${resourceUri}`);
        }
      }

      let manager: ApplicationUser;

      // the Manager details are literally a duplicate of the applicant OR
      // we grab them from elsewhere in the CSV
      if (newApplication.daf_applicant_pi_yn === "1") {
        manager = {
          email: newApplication.daf_applicant_email,
          displayName: newApplication.daf_applicant_name,
          institution: newApplication.daf_applicant_institution,
          role: "Manager",
        };
        checkValidApplicationUser(manager, "applicant");
      } else {
        manager = {
          email: newApplication.daf_pi_email,
          displayName: newApplication.daf_pi_name,
          institution:
            newApplication.daf_pi_institution_same === "1"
              ? newApplication.daf_applicant_institution
              : newApplication.daf_pi_institution,
          role: "Manager",
        };
        checkValidApplicationUser(manager, "manager");
      }

      const otherResearchers: ApplicationUser[] = [];

      if (newApplication.daf_collab_num) {
        for (
          let otherResearchCount = 0;
          otherResearchCount < parseInt(newApplication.daf_collab_num);
          otherResearchCount++
        ) {
          const siteNumber = (otherResearchCount + 1).toString();
          const isHoldingData =
            (newApplication as any)["daf_data_house_site" + siteNumber] === "1";
          const r: ApplicationUser = {
            email: (newApplication as any)[
              "daf_contact_email_site" + siteNumber
            ],
            displayName: (newApplication as any)[
              "daf_contact_site" + siteNumber
            ],
            institution: (newApplication as any)[
              "daf_institution_site" + siteNumber
            ],
            // TODO - once we have a "no download" role - we need to set it here
            role: isHoldingData ? "Member" : "Member",
          };
          checkValidApplicationUser(r, "collaborator" + siteNumber);
          otherResearchers.push(r);
        }
      }

      const studyType = australianGenomicsDacRedcapToDuoString(newApplication);

      if (!studyType) {
        throw new Error(
          "The application had no type of study expressed as a DUO code"
        );
      }

      const roleTable = [
        "| Name                   | Email                   | Institute       | Role             |",
        "| ---------------------- | ----------------------- | --------------- | ---------------- |",
      ];

      roleTable.push(
        `| ${manager.displayName} | ${manager.email} | ${manager.institution} | ${manager.role} |`
      );
      for (const o of otherResearchers) {
        roleTable.push(
          `| ${o.displayName} | ${o.email} | ${o.institution} | ${o.role} |`
        );
      }

      const releaseKey = await getNextReleaseKey(
        this.settings.releaseKeyPrefix
      ).run(t);

      const newRelease = await e
        .insert(e.release.Release, {
          created: e.datetime_current(),
          lastUpdatedSubjectId: user.subjectId,
          applicationDacIdentifier: e.tuple({
            system: AG_REDCAP_URL,
            value: e.str(newApplication.daf_num),
          }),
          applicationDacTitle:
            newApplication.daf_project_title || "Untitled in Redcap",
          applicationDacDetails: `
### Source

This application was sourced from Australian Genomics Redcap on ${format(
            new Date(),
            "dd/MM/yyyy"
          )}.

The identifier for this application in the source is

~~~
${newApplication.daf_num}
~~~

### Summary

${newApplication.daf_public_summ}

### Ethics

${
  newApplication.daf_hrec_approve === "1"
    ? `HREC ${newApplication.daf_hrec_num} was approved on ${newApplication.daf_hrec_approve_dt}`
    : "No approved HREC recorded"
}

### Created
 
${newApplication.application_date_hid}

### Applicant
 
${newApplication.daf_applicant_name} (${newApplication.daf_applicant_email})
${newApplication.daf_applicant_institution}

### Involved (at time of application)

${roleTable.join("\n")}

`,
          applicationCoded: e.insert(e.release.ApplicationCoded, {
            studyAgreesToPublish: true,
            studyIsNotCommercial: true,
            diseasesOfStudy: makeEmptyCodeArray(),
            countriesInvolved: makeEmptyCodeArray(),
            studyType: studyType,
            beaconQuery: {},
          }),
          datasetIndividualUrisOrderPreference: [""],
          datasetSpecimenUrisOrderPreference: [""],
          datasetCaseUrisOrderPreference: [""],
          isAllowedReadData: false,
          isAllowedVariantData: false,
          isAllowedPhenotypeData: false,
          releaseKey,
          // for the moment we fix this to a known secret
          releasePassword: "abcd",
          datasetUris: e.literal(
            e.array(e.str),
            Object.keys(resourceToDatasetMap)
          ),
          dataSharingConfiguration: e.insert(
            e.release.DataSharingConfiguration,
            {}
          ),
          // NOTE: this is slightly non-standard as the audit event here is not created as part of the
          // audit service - however this allows us to make it all a single db operation
          // make sure the audit code here keeps in sync with the basic add audit event
          releaseAuditLog: e.set(
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
        .run(t);

      await insertPotentialOrReal(
        t,
        manager,
        manager.role,
        newRelease.id,
        releaseKey
      );

      for (const r of otherResearchers) {
        await insertPotentialOrReal(t, r, r.role, newRelease.id, releaseKey);
      }

      return newRelease;
    });

    // TODO: move this inside the transaction once we have a 'transactionable' version of this service method
    await this.userService.registerRoleInRelease(
      user,
      newRelease.id,
      "Administrator"
    );

    return newRelease.id;
  }
}
