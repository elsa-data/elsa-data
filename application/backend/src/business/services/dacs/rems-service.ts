import * as edgedb from "edgedb";
import { makeEmptyCodeArray } from "../../../test-data/util/test-data-helpers";
import e from "../../../../dbschema/edgeql-js";
import { inject, injectable } from "tsyringe";
import axios from "axios";
import { RemsApprovedApplicationType } from "@umccr/elsa-types";
import { UserService } from "../user-service";
import { AuthenticatedUser } from "../../authenticated-user";
import { ElsaSettings } from "../../../config/elsa-settings";
import { format } from "date-fns";
import { getNextReleaseKey } from "../../db/release-queries";
import { ReleaseService } from "../releases/release-service";
import { DacRemsType } from "../../../config/config-schema-dac";
import {
  ReleaseCreateError,
  ReleaseViewError,
} from "../../exceptions/release-authorisation";
import { UserData } from "../../data/user-data";
import { generateZipPassword } from "../../../helpers/passwords";
import { isEmpty, isInteger } from "lodash";
import { Logger } from "pino";
import {
  ApplicationUser,
  checkValidApplicationUser,
  insertPotentialOrReal,
} from "../_dac-user-helper";
import { AuditEventService } from "../audit-event-service";
@injectable()
export class RemsService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Logger") private readonly logger: Logger,
    @inject(UserService) private readonly userService: UserService,
    @inject(UserData) private readonly userData: UserData,
    @inject(ReleaseService) private readonly releaseService: ReleaseService,
    @inject(AuditEventService)
    private readonly auditEventService: AuditEventService,
  ) {}

  /**
   * Make the API call to fetch active applications on a REMS instance.
   *
   * @param url
   * @param botUser
   * @param botKey
   * @param applicationId if present, return just this single application rather than the set
   * @private
   */
  private async getRemsApplications(
    url: string,
    botUser: string,
    botKey: string,
    applicationId?: number,
  ) {
    return await axios
      .get(
        isInteger(applicationId)
          ? `${url}/api/applications/${applicationId}`
          : `${url}/api/applications`,
        {
          headers: {
            accept: "application/json",
            "x-rems-api-key": botKey,
            "x-rems-user-id": botUser,
          },
        },
      )
      .then((a) => a.data);
  }

  /**
   * Return a list of possible completed applications at the given REMS instance.
   *
   * @param user
   * @param dacConfiguration
   */
  public async detectNewReleases(
    user: AuthenticatedUser,
    dacConfiguration: DacRemsType,
  ): Promise<RemsApprovedApplicationType[]> {
    const dbUser = await this.userData.getDbUser(this.edgeDbClient, user);

    if (!dbUser.isAllowedCreateRelease) throw new ReleaseViewError();

    this.logger.info(
      `Looking for releases for REMS DAC ${dacConfiguration.id}`,
    );

    // the application data from REMS
    // TODO handle/filter the fact there may be *lots* of REMS applications
    //      (in the early days of REMS we will get away with this)
    const remsApplicationData = await this.getRemsApplications(
      dacConfiguration.url,
      dacConfiguration.botUser,
      dacConfiguration.botKey,
    );

    // eventually we might need to put a date range on this but let's see if we can get away
    // with fetching all the release identifiers
    const currentReleaseKeys = new Set<string>(
      await e
        .select(e.release.Release, (r) => ({
          applicationDacIdentifier: true,
          filter: e.op(
            r.applicationDacIdentifier.system,
            "=",
            dacConfiguration.url,
          ),
        }))
        .applicationDacIdentifier.value.run(this.edgeDbClient),
    );

    const newReleases: RemsApprovedApplicationType[] = [];

    for (const application of remsApplicationData ?? []) {
      if (application["application/state"] === "application.state/approved") {
        const applicant = application["application/applicant"];
        const remsId: number = application["application/id"];

        if (isEmpty(applicant)) continue;

        // without a valid REMS internal id we can't even interact with the API - so skip
        if (!isFinite(remsId)) continue;

        // if we've already turned this REMS application into a release - then skip
        if (currentReleaseKeys.has(remsId.toString())) continue;

        newReleases.push({
          // consider what date we want to actually put here...
          when: application["application/modified"],
          remsId: remsId,
          description:
            application["application/description"] ?? "<no description>",
          whoDisplay: applicant?.name ?? "<no applicant name>",
          whoEmail: applicant?.email ?? "<no applicant email>",
        });
      }
    }

    return newReleases;
  }

  public async startNewRelease(
    user: AuthenticatedUser,
    dacConfiguration: DacRemsType,
    remsId: number,
  ): Promise<string> {
    const dbUser = await this.userData.getDbUser(this.edgeDbClient, user);

    if (!dbUser.isAllowedCreateRelease) throw new ReleaseCreateError();

    this.logger.info(
      `Attempting create for REMS entry ${remsId} for REMS DAC ${dacConfiguration.id}`,
    );

    // return the single application we are interested in from this REMS
    const application = await this.getRemsApplications(
      dacConfiguration.url,
      dacConfiguration.botUser,
      dacConfiguration.botKey,
      remsId,
    );

    // TODO: some error checking here

    return await this.edgeDbClient.transaction(async (t) => {
      const resourceToDatasetMap: { [uri: string]: string } = {};

      // loop through the resources (datasets) in the application and make sure we are a data holder
      // for them (create a map of dataset id to our edgedb id for that dataset)
      for (const res of application["application/resources"] || []) {
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
              `Too many matching datasets on record for ${remsDatasetUri}`,
            );
          else resourceToDatasetMap[remsDatasetUri] = matchDs[0].id;
        } else {
          throw new Error(`No matching dataset for ${remsDatasetUri}`);
        }
      }

      const releaseKey = getNextReleaseKey(this.settings.releaseKeyPrefix);

      const newRelease = await e
        .select(
          e.insert(e.release.Release, {
            created: e.datetime_current(),
            lastUpdatedSubjectId: user.subjectId,
            applicationDacIdentifier: e.tuple({
              system: dacConfiguration.url,
              value: e.str(remsId.toString()),
            }),
            applicationDacTitle:
              application["application/description"] || "Untitled in REMS",
            applicationDacDetails: `
#### Source

This application was sourced from ${dacConfiguration.url} on ${format(
              new Date(),
              "dd/MM/yyyy",
            )}.
          
The identifier for this application in REMS is

~~~
${remsId.toString()}
~~~

See the [original application](${
              dacConfiguration.url
            }/application/${remsId}) ↪ in REMS (you may have to log in to REMS)                    

#### Summary

##### Created
 
~~~
${application["application/created"]}
~~~

##### Applicant
 
~~~
${JSON.stringify(application["application/applicant"], null, 2)}
~~~
`,
            applicationCoded: e.insert(e.release.ApplicationCoded, {
              studyAgreesToPublish: true,
              studyIsNotCommercial: true,
              diseasesOfStudy: makeEmptyCodeArray(),
              countriesInvolved: makeEmptyCodeArray(),
              studyType: "HMB",
              beaconQuery: {},
            }),
            isAllowedReadData: false,
            isAllowedVariantData: false,
            isAllowedPhenotypeData: false,
            datasetIndividualUrisOrderPreference: [""],
            datasetSpecimenUrisOrderPreference: [""],
            datasetCaseUrisOrderPreference: [""],
            releaseKey: releaseKey,
            releasePassword: generateZipPassword(),
            datasetUris: e.literal(
              e.array(e.str),
              Object.keys(resourceToDatasetMap),
            ),
            dataSharingConfiguration: e.insert(
              e.release.DataSharingConfiguration,
              {},
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
                inProgress: false,
              }),
            ),
          }),
          (_) => ({
            id: true,
            releaseKey: true,
          }),
        )
        .run(this.edgeDbClient);

      const applicant = application["application/applicant"];

      if (applicant && applicant["email"]) {
        const applicantAu: ApplicationUser = {
          role: "Manager",
          email: applicant["email"],
          displayName: applicant["name"],
        };
        await insertPotentialOrReal(
          t,
          applicantAu,
          "Manager",
          newRelease.id,
          newRelease.releaseKey,
          this.auditEventService,
        );
      }

      await this.userService.registerRoleInRelease(
        user,
        newRelease.releaseKey,
        "Administrator",
      );

      return newRelease.releaseKey;
    });

    /*{
"application/workflow": {
  "workflow/id": 1,
  "workflow/type": "workflow/default",
  "workflow.dynamic/handlers": [
    {
      "userid": "auth0|62412e5cfec0a2006fa9cfaa",
      "name": "REMS Admin",
      "email": "rems+admin@umccr.org",
      "handler/active?": true
    }
  ]
},
"application/external-id": "2022/5",
"application/first-submitted": "2022-05-19T06:23:48.756Z",
"application/blacklist": [],
"application/id": 5,
"application/duo": {
  "duo/codes": [
    {
      "id": "DUO:0000007",
      "restrictions": [
        {
          "type": "mondo",
          "values": [
            {
              "id": "MONDO:0000437",
              "label": "cerebellar ataxia"
            }
          ]
        }
      ],
      "shorthand": "DS",
      "label": {
        "en": "disease specific research"
      },
      "description": {
        "en": "This data use permission indicates that use is allowed provided it is related to the specified disease."
      }
    }
  ],
  "duo/matches": []
},
"application/applicant": {
  "userid": "auth0|62412e5cfec0a2006fa9cfaa",
  "name": "REMS Admin",
  "email": "rems+admin@umccr.org"
},
"application/todo": null,
"application/members": [],
"application/resources": [
  {
    "catalogue-item/end": null,
    "catalogue-item/expired": false,
    "catalogue-item/enabled": true,
    "resource/id": 3,
    "catalogue-item/title": {
      "en": "Bowel Cancer Dataset 2022"
    },
    "catalogue-item/infourl": {},
    "resource/ext-id": "http://cci.org.au/datasets/BOWEL",
    "catalogue-item/start": "2022-05-19T06:22:20.709Z",
    "catalogue-item/archived": false,
    "catalogue-item/id": 3
  }
],
"application/deadline": "2022-05-23T06:23:48.756Z",
"application/accepted-licenses": {
  "auth0|62412e5cfec0a2006fa9cfaa": [
    1
  ]
},
"application/invited-members": [],
"application/description": "",
"application/generated-external-id": "2022/5",
"application/permissions": [
  "see-everything"
],
"application/last-activity": "2022-05-19T06:24:41.285Z",
"application/roles": [
  "reporter"
],
"application/attachments": [
  {
    "attachment/id": 1,
    "attachment/filename": "280505472_2253912114787458_8118172808640493719_n.jpg",
    "attachment/type": "image/jpeg"
  }
],
"application/created": "2022-05-19T06:22:49.665Z",
"application/state": "application.state/approved",
"application/modified": "2022-05-19T06:23:48.694Z"
}*/
  }
}
