import _ from "lodash";
import { ObjectStoreRecordKey } from "../../../../../common/elsa-types/schemas";
import type { ManifestBucketKeyObjectType, ManifestTsvBodyType } from "./manifest-bucket-key-types";
import { ManifestMasterType } from "./manifest-master-types";
import { unpackFileArtifact } from "../_release-file-list-helper";
import { PresignedUrlsService } from "../presigned-urls-service";

async function manifestBodyElements(
  datasetSpecimen: any,
  presignedUrlsService: PresignedUrlsService,
  releaseKey: string
): Promise<ManifestBucketKeyObjectType[]> {
  const artifacts: any[] = datasetSpecimen.artifacts;
  const unpackedFileArtifacts = artifacts.flatMap(
    (a: any) => unpackFileArtifact(a) ?? []
  );
  const signedFileArtifacts = await Promise.all(unpackedFileArtifacts.map(
    async (f) => ({
      ...f,
      objectStoreSigned: await presignedUrlsService.presign(
        releaseKey,
        f.objectStoreProtocol,
        f.objectStoreBucket,
        f.objectStoreKey,
      )
    })
  ));

  return await Promise.all(signedFileArtifacts.map(async (a) => ({
    ...a,
    caseId: datasetSpecimen.case_.id,
    patientId: datasetSpecimen.patient.id,
    specimenId: datasetSpecimen.id,
  })));
}

export async function transformMasterManifestToTsvManifest(
  masterManifest: ManifestMasterType,
  presignedUrlsService: PresignedUrlsService,
  releaseKey: string
): Promise<ManifestTsvBodyType> {
  return (
    await Promise.all(masterManifest.specimenList.map(
      async (s) => await manifestBodyElements(s, presignedUrlsService, releaseKey)
    ))
  ).flat(1);
}
