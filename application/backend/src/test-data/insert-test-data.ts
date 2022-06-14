import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { insertCARDIAC } from "./insert-test-data-cardiac";
import { insert10G } from "./insert-test-data-10g";
import { ApplicationCodedTypeV1 } from "@umccr/elsa-types";
import { ElsaSettings } from "../bootstrap-settings";
import axios from "axios";
import { remsApplicationsResponse } from "./mock-responses";
import { makeSystemlessIdentifierArray } from "./insert-test-data-helpers";
import { usersService } from "../business/services/users";
import { AuthenticatedUser } from "../business/authenticated-user";

const edgeDbClient = edgedb.createClient();

// make an empty dataset.. for test purposes we want at least 10 datasets just so we can deal with paging
async function insertBlankDataset(id: string, uri: string) {
  return await e
    .insert(e.dataset.Dataset, {
      // temp datasets to match an existing REMS application
      uri: uri,
      externalIdentifiers: makeSystemlessIdentifierArray(id),
      description: `Madeup dataset ${id}`,
      cases: e.set(),
    })
    .run(edgeDbClient);
}

export async function insertTestData(settings: ElsaSettings) {
  console.log(`Inserting test data`);
  await insert10G();
  await insertCARDIAC();
  //await insertIICON();

  await insertBlankDataset(
    "BM",
    "urn:fdc:australiangenomics.org.au:2022:datasets/bm"
  );
  await insertBlankDataset(
    "MITO",
    "urn:fdc:australiangenomics.org.au:2022:datasets/mito"
  );
  await insertBlankDataset(
    "BOW",
    "urn:fdc:australiangenomics.org.au:2022:datasets/bow"
  );
  await insertBlankDataset(
    "RR",
    "urn:fdc:australiangenomics.org.au:2022:datasets/rr"
  );
  await insertBlankDataset(
    "SS",
    "urn:fdc:australiangenomics.org.au:2022:datasets/ss"
  );
  await insertBlankDataset(
    "TT",
    "urn:fdc:australiangenomics.org.au:2022:datasets/tt"
  );
  await insertBlankDataset(
    "UU",
    "urn:fdc:australiangenomics.org.au:2022:datasets/uu"
  );
  await insertBlankDataset(
    "VV",
    "urn:fdc:australiangenomics.org.au:2022:datasets/vv"
  );
  await insertBlankDataset(
    "WW",
    "urn:fdc:australiangenomics.org.au:2022:datasets/ww"
  );
  await insertBlankDataset(
    "XX",
    "urn:fdc:australiangenomics.org.au:2022:datasets/xx"
  );
  await insertBlankDataset(
    "YY",
    "urn:fdc:australiangenomics.org.au:2022:datasets/yy"
  );
  await insertBlankDataset(
    "ZZ",
    "urn:fdc:australiangenomics.org.au:2022:datasets/zz"
  );

  /*const randomDs = await e
      .insert(e.dataset.Dataset, {
        // temp datasets to match an existing REMS application
        uri: "http://cci.org.au/datasets/BOWEL",
        externalIdentifiers: makeSystemlessIdentifierArray("BOWEL"),
        description: "Madeup BOWEL",
        cases: e.set()
      }).run(client); */

  await insertRelease1(settings);

  console.log(
    `  Number of object artifacts present = ${await e
      .count(e.lab.ArtifactBase)
      .run(edgeDbClient)}`
  );
  console.log(
    `  Number of users present = ${await e
      .count(e.permission.User)
      .run(edgeDbClient)}`
  );
  console.log(
    `  Number of runs present = ${await e.count(e.lab.Run).run(edgeDbClient)}`
  );
  console.log(
    `  Number of releases present = ${await e
      .count(e.release.Release)
      .run(edgeDbClient)}`
  );

  const eachDs = e.for(e.dataset.Dataset, (ds) => {
    return e.select({
      dataset: ds.uri,
      casesCount: e.count(ds.cases),
      patientsCount: e.count(ds.cases.patients),
      specimensCount: e.count(ds.cases.patients.specimens),
    });
  });

  console.log(await eachDs.run(edgeDbClient));
}

async function insertRelease1(settings: ElsaSettings) {
  const appCoded: ApplicationCodedTypeV1 = {
    version: 1,
    countriesInvolved: [
      {
        system: "urn:iso:std:iso:3166",
        code: "AU",
      },
    ],
    researchType: {
      code: "DS",
      diseases: [
        {
          system: "http://purl.obolibrary.org/obo/mondo.owl",
          code: "MONDO:0019501",
          // we have no display value here so that we test rehydrating at the frontend
        },
        {
          system: "http://purl.obolibrary.org/obo/mondo.owl",
          code: "MONDO:0008678",
          display: "Williams syndrome",
        },
        {
          system: "http://purl.obolibrary.org/obo/mondo.owl",
          code: "MONDO:0021531",
          // we have no display value here so that we test rehydrating at the frontend
        },
      ],
    },
    institutesInvolved: [],
  };

  const appData = { data: [] };

  /*await axios.get(`${settings.remsUrl}/api/applications`, {
      headers: {
        accept: "application/json",
        "x-rems-api-key": settings.remsBotKey,
        "x-rems-user-id": settings.remsBotUser,
      },
    })
  };*/

  for (const application of appData.data) {
    if (application["application/state"] === "application.state/approved") {
      console.log(JSON.stringify(application, null, 2));

      const resourceToDatasetMap: { [uri: string]: string } = {};

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
          applicationCoded: e.json(appCoded),
          datasetUris: e.literal(
            e.array(e.str),
            Object.keys(resourceToDatasetMap)
          ),
        })
        .run(edgeDbClient);

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

  const r1 = await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      applicationDacIdentifier: "ABC",
      applicationCoded: e.json(appCoded),
      datasetUris: e.array(["urn:fdc:umccr.org:2022:dataset/10g"]),
    })
    .run(edgeDbClient);

  const r2 = await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      applicationDacIdentifier: "XYZ",
      applicationCoded: e.json({
        version: 1,
        countriesInvolved: [
          {
            system: "urn:iso:std:iso:3166",
            code: "AU",
          },
        ],
        researchType: {
          code: "HMB",
        },
        institutesInvolved: [],
      }),
      datasetUris: e.array([
        "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac",
      ]),
    })
    .run(edgeDbClient);

  const user2 = await e
    .insert(e.permission.User, {
      subjectId: "http://subject2.com",
      displayName: "Test User 2",
    })
    .run(edgeDbClient);

  const user1 = await e
    .insert(e.permission.User, {
      subjectId: "http://subject1.com",
      displayName: "Test User",
      releaseParticipant: e.select(e.release.Release, (r) => ({
        filter: e.op(e.uuid(r1.id), "=", r.id),
        "@role": e.str("PI"),
      })),
    })
    .run(edgeDbClient);

  await e.update(e.permission.User, (user) => ({
    filter: e.op(user.id, "=", e.uuid(user1.id)),
    set: {
      releaseParticipant: {
        "+=": e.select(e.release.Release, (r) => ({
          filter: e.op(e.uuid(r2.id), "=", r.id),
          "@role": e.str("Member"),
        })),
      },
    },
  }));

  //console.log(await usersService.roleInRelease("http://subject1.com", r1.id));
  //console.log(await usersService.roleInRelease(new AuthenticatedUser("http://subject2.com", r1.id));
}
