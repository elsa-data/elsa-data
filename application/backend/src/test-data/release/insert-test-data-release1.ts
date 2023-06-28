import e from "../../../dbschema/edgeql-js";
import {
  findSpecimenQuery,
  makeDoubleCodeArray,
  makeIdentifierTuple,
  makeSingleCodeArray,
} from "../util/test-data-helpers";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import { releaseGetSpecimenTreeAndFileArtifacts } from "../../../dbschema/queries";
import { transformDbManifestToMasterManifest } from "../../business/services/manifests/manifest-master-helper";
import { InsertReleaseProps, insertRole } from "./helpers";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
  MARGE_BAI_S3,
  MARGE_BAM_S3,
  MARGE_SPECIMEN,
} from "../dataset/insert-test-data-10f-simpsons";
import { ELROY_SPECIMEN } from "../dataset/insert-test-data-10f-jetsons";

const applicationDetails = `
#### Origin

This is an application from REMS instance HGPP.

#### Purpose

We are going to take the test data and study it.

#### Ethics

Ethics form XYZ.

#### Other DAC application details

* Signed by A, B, C
* Agreed to condition Y

#### A table

| a | b |
| - | - |
| 4 | 5 |
`;

const RELEASE_KEY_1 = "R001";

export async function insertRelease1(
  dc: DependencyContainer,
  releaseProps: InsertReleaseProps
) {
  const { settings, logger, edgeDbClient } = getServices(dc);
  const { releaseAdministrator, releaseManager, releaseMember, datasetUris } =
    releaseProps;

  if (releaseAdministrator.length < 1)
    throw new Error("Release has no Administrator");

  const insertRelease1 = await e
    .insert(e.release.Release, {
      lastUpdatedSubjectId: releaseAdministrator[0].subject_id,
      applicationDacTitle: "A Study of Lots of Test Data",
      applicationDacIdentifier: makeIdentifierTuple(
        "https://rems.australiangenomics.org.au",
        "56"
      ),
      applicationDacDetails: applicationDetails,
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: "DS",
        countriesInvolved: makeSingleCodeArray(
          settings.isoCountrySystemUri,
          "AUS"
        ),
        diseasesOfStudy: makeDoubleCodeArray(
          settings.mondoSystem.uri,
          "MONDO:0008678",
          settings.mondoSystem.uri,
          "MONDO:0021531"
        ),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
        beaconQuery: {},
      }),
      //
      //
      // B5MN76L3BN
      //
      //
      releaseKey: RELEASE_KEY_1,
      activation: e.insert(e.release.Activation, {
        activatedAt: e.datetime(new Date(2022, 9, 12, 4, 2, 5)),
        activatedById: releaseAdministrator[0].subject_id,
        activatedByDisplayName: releaseAdministrator[0].name,
        manifest: e.json({}),
        manifestEtag: "123456",
      }),
      previouslyActivated: e.set(
        e.insert(e.release.Activation, {
          activatedAt: e.datetime(new Date(2022, 6, 7)),
          activatedById: releaseAdministrator[0].subject_id,
          activatedByDisplayName: releaseAdministrator[0].name,
          manifest: e.json({}),
          manifestEtag: "abcdef",
        })
      ),
      dataSharingConfiguration: e.insert(e.release.DataSharingConfiguration, {
        objectSigningEnabled: true,
        htsgetEnabled: true,
        awsAccessPointEnabled: true,
        gcpStorageIamEnabled: true,
        copyOutEnabled: true,
      }),
      releasePassword: "abcd", // pragma: allowlist secret
      datasetUris: datasetUris,
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      isAllowedReadData: false,
      isAllowedVariantData: true,
      isAllowedPhenotypeData: false,
      isAllowedS3Data: true,
      selectedSpecimens: e.set(
        // we fully select one trio
        findSpecimenQuery(BART_SPECIMEN),
        findSpecimenQuery(HOMER_SPECIMEN),
        findSpecimenQuery(MARGE_SPECIMEN),
        // and just the proband of another trio
        findSpecimenQuery(ELROY_SPECIMEN)
      ),
      releaseAuditLog: e.set(
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "C",
          actionDescription: "Created Release",
          outcome: 0,
          whoDisplayName: "System",
          whoId: "system",
          occurredDateTime: e.datetime_current(),
          inProgress: false,
        }),
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "E",
          actionDescription: "Test in-progress audit event",
          outcome: 8,
          whoDisplayName: "System",
          whoId: "system",
          occurredDateTime: e.datetime_current(),
          details: e.json({
            errorMessage: "Audit entry not completed",
          }),
          inProgress: true,
        })
      ),
      dataEgressRecord: await makeSyntheticDataEgressRecord(),
    })
    .run(edgeDbClient);

  // Activating r1 release (with proper manifest)
  const m = await releaseGetSpecimenTreeAndFileArtifacts(edgeDbClient, {
    releaseKey: RELEASE_KEY_1,
  });
  const masterManifest = await transformDbManifestToMasterManifest(m);
  await e
    .update(e.release.Release, (r) => ({
      filter: e.op(r.releaseKey, "=", RELEASE_KEY_1),
      set: {
        activation: e.insert(e.release.Activation, {
          activatedById: releaseAdministrator[0].subject_id,
          activatedByDisplayName: releaseAdministrator[0].name,
          manifest: e.json(masterManifest),
          manifestEtag: "0123",
        }),
      },
    }))
    .run(edgeDbClient);

  // Inserting user roles assign to this release
  for (const user of releaseAdministrator) {
    await insertRole(
      insertRelease1.id,
      user.email,
      "Administrator",
      edgeDbClient
    );
  }
  for (const user of releaseManager) {
    await insertRole(insertRelease1.id, user.email, "Manager", edgeDbClient);
  }
  for (const user of releaseMember) {
    await insertRole(insertRelease1.id, user.email, "Member", edgeDbClient);
  }

  return insertRelease1;
}

/**
 * Helper Functions
 */
export const makeSyntheticDataEgressRecord = async () => {
  const makeDataEgressLog = async (fileUrl: string) => {
    return {
      auditId: "0f8e7694-d1eb-11ed-afa1-0242ac120002",
      occurredDateTime: e.datetime(new Date()),
      description: "Accessed via pre-signed URL",

      sourceIpAddress: "123.123.123.123",
      sourceLocation: { city: "Melbourne", country: "Australia", region: "AU" },
      egressBytes: 10188721080,
      fileUrl: fileUrl,
      fileSize: 30,
    };
  };

  return e.set(
    e.insert(e.release.DataEgressRecord, await makeDataEgressLog(MARGE_BAM_S3)),
    e.insert(e.release.DataEgressRecord, await makeDataEgressLog(MARGE_BAI_S3))
  );
};
