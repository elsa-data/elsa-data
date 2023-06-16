import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { makeEmptyCodeArray } from "../../../test-data/util/test-data-helpers";
import { inject, injectable } from "tsyringe";
import { australianGenomicsDacRedcapToDuoString } from "@umccr/elsa-types";
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
import {
  DacRedcapAustralianGenomicsCsvType,
  DacType,
} from "../../../config/config-schema-dac";
import { Logger } from "pino";

@injectable()
export class RedcapImportApplicationService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Logger") private readonly logger: Logger,
    @inject(UserService) private readonly userService: UserService,
    @inject(ReleaseService) private readonly releaseService: ReleaseService
  ) {}

  /**
   * Given an Australian Genomics redcap output CSV file (converted to JSON), we return
   * those rows that are candidates for this Elsa instance = that is we have not already
   * seen this application AND it involves a dataset we control (+ whatever other rules
   * come up)
   *
   * @param user
   * @param dacConfiguration the config for this instance of Redcap from the config
   * @param csvAsJson the raw CSV/JSON object
   */
  public async detectNewReleases(
    user: AuthenticatedUser,
    dacConfiguration: DacRedcapAustralianGenomicsCsvType,
    csvAsJson: AustraliaGenomicsDacRedcap[]
  ): Promise<AustraliaGenomicsDacRedcap[]> {
    const perms = await this.userService.getUser(user);

    if (!perms.isAllowedCreateRelease)
      throw new Error("Not allowed to create new releases");

    // eventually we might need to put a date range on this but let's see if we can get away
    // with fetching all the release identifiers FOR OUR UNIQUE AG SYSTEM
    const currentReleaseKeys = new Set<string>(
      await e
        .select(e.release.Release, (r) => ({
          applicationDacIdentifier: true,
          filter: e.op(
            r.applicationDacIdentifier.system,
            "=",
            dacConfiguration.identifierSystem
          ),
        }))
        .applicationDacIdentifier.value.run(this.edgeDbClient)
    );

    const results: AustraliaGenomicsDacRedcap[] = [];

    // for redcap - the only criteria we check for the 'new' entries passed in - is that
    // we haven't already created a release for them
    // TODO that we have the corresponding datasets for the CSV columns we see
    for (const possibleApplication of csvAsJson || []) {
      if (!currentReleaseKeys.has(possibleApplication.daf_num)) {
        results.push(possibleApplication);
      }
    }

    return results;
  }

  /**
   * Given a new application as a CSV/JSON object - we create a new release
   * representing it - in a transaction.
   *
   * @param user the user attempting this
   * @param dacConfiguration the config for this instance of Redcap from the config
   * @param csvAsJson the raw CSV/JSON object
   * @return the release id of the new release
   */
  public async startNewRelease(
    user: AuthenticatedUser,
    dacConfiguration: DacRedcapAustralianGenomicsCsvType,
    csvAsJson: AustraliaGenomicsDacRedcap
  ): Promise<string> {
    const perms = await this.userService.getUser(user);

    if (!perms.isAllowedCreateRelease)
      throw new Error("Not allowed to create new releases");

    // TODO: some error checking here of the incoming application data

    const resourceToDatasetMap: { [uri: string]: string } = {};

    // we can do this outside our transaction as dataset definitions don't really change quickly... we also
    // want to allow us to abort out of this *before* even starting a transaction (if they've used the
    // wrong CSV file for instance)

    const csvAsJsonObject: any = csvAsJson;

    // first - and just for sane error reporting - we are going to find all the known flagship columns that
    // are set to 1
    const allRequested: string[] = [];

    for (const [csvColumnName, val] of Object.entries(csvAsJsonObject)) {
      if (!csvColumnName.startsWith("daf_flagships_")) continue;

      if (val === "1") allRequested.push(csvColumnName);
    }

    this.logger.debug(
      `Redcap CSV application via DAC ${dacConfiguration.id}/${dacConfiguration.type} requested the following flagships ${allRequested}`
    );

    // establish the map for all the datasets that this particular application wants - via our configuration
    for (const [csvColumnName, wantedDatasetUri] of Object.entries(
      dacConfiguration.csvFlagshipDatasets
    )) {
      // lookup the column header we are told is needed
      if (!(csvColumnName in csvAsJsonObject))
        throw new Error(
          `Configured column header name ${csvColumnName} was not in the given Redcap CSV`
        );

      // the application has not asked for this - so we can skip
      if (csvAsJsonObject[csvColumnName] != "1") continue;

      // do we have that dataset registered in our Elsa Data? (TODO should be looking at our configured datasets - not db?)
      const matchDs = await e
        .select(e.dataset.Dataset, (ds) => ({
          id: true,
          filter: e.op(e.str(wantedDatasetUri), "=", ds.uri),
        }))
        .run(this.edgeDbClient);

      if (matchDs && matchDs.length > 0) {
        if (matchDs.length > 1)
          throw new Error(
            `Too many matching datasets on record for ${wantedDatasetUri}`
          );
        else resourceToDatasetMap[wantedDatasetUri] = matchDs[0].id;
      } else {
        throw new Error(
          `Configured Redcap dataset ${wantedDatasetUri} was not loaded in this Elsa Data instance`
        );
      }
    }

    if (Object.values(resourceToDatasetMap).length === 0)
      throw new Error(
        "No datasets that exist in this Elsa Data instance were applied for by this application CSV"
      );

    // note we create the release key *outside* the transaction but it will never be used if
    // the transaction aborts (which is fine)
    const releaseKey = await getNextReleaseKey(
      this.settings.releaseKeyPrefix
    ).run(this.edgeDbClient);

    // start our transactional create
    const newRelease = await this.edgeDbClient.transaction(async (t) => {
      let manager: ApplicationUser;

      // the Manager details are literally a duplicate of the applicant OR
      // we grab them from elsewhere in the CSV
      if (csvAsJson.daf_applicant_pi_yn === "1") {
        manager = {
          email: csvAsJson.daf_applicant_email,
          displayName: csvAsJson.daf_applicant_name,
          institution: csvAsJson.daf_applicant_institution,
          role: "Manager",
        };
        checkValidApplicationUser(manager, "applicant");
      } else {
        manager = {
          email: csvAsJson.daf_pi_email,
          displayName: csvAsJson.daf_pi_name,
          institution:
            csvAsJson.daf_pi_institution_same === "1"
              ? csvAsJson.daf_applicant_institution
              : csvAsJson.daf_pi_institution,
          role: "Manager",
        };
        checkValidApplicationUser(manager, "manager");
      }

      const otherResearchers: ApplicationUser[] = [];

      if (csvAsJson.daf_collab_num) {
        for (
          let otherResearchCount = 0;
          otherResearchCount < parseInt(csvAsJson.daf_collab_num);
          otherResearchCount++
        ) {
          const siteNumber = (otherResearchCount + 1).toString();
          const isHoldingData =
            (csvAsJson as any)["daf_data_house_site" + siteNumber] === "1";
          const r: ApplicationUser = {
            email: (csvAsJson as any)["daf_contact_email_site" + siteNumber],
            displayName: (csvAsJson as any)["daf_contact_site" + siteNumber],
            institution: (csvAsJson as any)[
              "daf_institution_site" + siteNumber
            ],
            // TODO - once we have a "no download" role - we need to set it here
            role: isHoldingData ? "Member" : "Member",
          };
          checkValidApplicationUser(r, "collaborator" + siteNumber);
          otherResearchers.push(r);
        }
      }

      const studyType = australianGenomicsDacRedcapToDuoString(csvAsJson);

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

      const newRelease = await e
        .insert(e.release.Release, {
          created: e.datetime_current(),
          lastUpdatedSubjectId: user.subjectId,
          applicationDacIdentifier: e.tuple({
            system: dacConfiguration.identifierSystem,
            value: e.str(csvAsJson.daf_num),
          }),
          applicationDacTitle:
            csvAsJson.daf_project_title || "Untitled in Redcap",
          applicationDacDetails: `
### Source

This application was sourced from Australian Genomics Redcap on ${format(
            new Date(),
            "dd/MM/yyyy"
          )}.

The identifier for this application in the source is

~~~
${csvAsJson.daf_num}
~~~

### Summary

${csvAsJson.daf_public_summ}

### Ethics

${
  csvAsJson.daf_hrec_approve === "1"
    ? `HREC ${csvAsJson.daf_hrec_num} was approved on ${csvAsJson.daf_hrec_approve_dt}`
    : "No approved HREC recorded"
}

### Created
 
${csvAsJson.application_date_hid}

### Applicant
 
${csvAsJson.daf_applicant_name} (${csvAsJson.daf_applicant_email})
${csvAsJson.daf_applicant_institution}

### Involved (at time of application - this can subsequently be altered - see User Management)

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

    return releaseKey;
  }
}
