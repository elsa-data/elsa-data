import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { makeEmptyCodeArray } from "../../test-data/test-data-helpers";
import { inject, injectable, singleton } from "tsyringe";
import { Client } from "edgedb";

@injectable()
@singleton()
export class RemsService {
  constructor(@inject("Database") private edgeDbClient: Client) {}

  public async import(url: string) {
    throw new Error("not implemented");

    /*await axios.get(`${settings.remsUrl}/api/applications`, {
          headers: {
            accept: "application/json",
            "x-rems-api-key": settings.remsBotKey,
            "x-rems-user-id": settings.remsBotUser,
          },
        })
      };*/

    const appData = { data: [] };

    for (const application of appData.data) {
      if (application["application/state"] === "application.state/approved") {
        console.log(JSON.stringify(application, null, 2));

        const resourceToDatasetMap: { [uri: string]: string } = {};
      }

      /*// loop through the resources (datasets) in the application and make sure we are a data holder
    // for them (create a map of dataset id to our edgedb id for that dataset)
    for (const res of application["application/resources"] || []) {
      const remsDatasetUri = res["resource/ext-id"];

      const matchDs = await e
        .select(e.dataset.Dataset, (ds) => ({
          id: true,
          filter: e.op(e.str(remsDatasetUri), "=", ds.uri),
        }))
        .run(client);

      if (matchDs && matchDs.length > 0) {
        if (matchDs.length > 1)
          throw new Error(
            `Too many matching datasets on record for ${remsDatasetUri}`
          );
        else resourceToDatasetMap[remsDatasetUri] = matchDs[0].id;
      } else {
        throw new Error(`No matching dataset for ${remsDatasetUri}`);
      }
    } */

      const r1 = await e
        .insert(e.release.Release, {
          created: e.datetime(new Date()),
          applicationDacIdentifier: application["application/external-id"],
          applicationDacTitle:
            application["application/description"] || "Untitled",
          applicationDacDetails: `
Created: ${application["application/created"]}
Applicant: ${JSON.stringify(
            application["application/applicant"],
            null,
            2
          )}          
`,
          applicationCoded: e.insert(e.release.ApplicationCoded, {
            studyAgreesToPublish: true,
            studyIsNotCommercial: true,
            diseasesOfStudy: makeEmptyCodeArray(),
            countriesInvolved: makeEmptyCodeArray(),
            studyType: "HMB",
          }),
          releasePassword: "AAAAA", // pragma: allowlist secret
          datasetUris: e.literal(e.array(e.str), Object.keys({})),
        })
        .run(this.edgeDbClient);

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
}
