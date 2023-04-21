import type {
  ManifestBucketKeyObjectType,
  ManifestTsvBodyType,
} from "./manifest-bucket-key-types";
import { ManifestMasterType } from "./manifest-master-types";
import { unpackFileArtifact } from "../_release-file-list-helper";
import { PresignedUrlService } from "../presigned-url-service";

async function manifestBodyElements(
  datasetSpecimen: any,
  presignedUrlService: PresignedUrlService,
  releaseKey: string,
  auditId: string
): Promise<ManifestBucketKeyObjectType[]> {
  const artifacts: any[] = datasetSpecimen.artifacts;
  const unpackedFileArtifacts = artifacts.flatMap(
    (a: any) => unpackFileArtifact(a) ?? []
  );
  const signedFileArtifacts = await Promise.all(
    unpackedFileArtifacts.map(async (f) => ({
      ...f,
      objectStoreSigned: await presignedUrlService.presign(
        releaseKey,
        f.objectStoreProtocol,
        f.objectStoreBucket,
        f.objectStoreKey,
        auditId
      ),
    }))
  );

  return await Promise.all(
    signedFileArtifacts.map(async (a) => ({
      ...a,
      caseId: datasetSpecimen.case_.id,
      patientId: datasetSpecimen.patient.id,
      specimenId: datasetSpecimen.id,
    }))
  );
}

export async function transformMasterManifestToTsvManifest(
  masterManifest: ManifestMasterType,
  presignedUrlService: PresignedUrlService,
  releaseKey: string,
  auditId: string
): Promise<ManifestTsvBodyType> {
  return (
    await Promise.all(
      masterManifest.specimenList.map(
        async (s) =>
          await manifestBodyElements(
            s,
            presignedUrlService,
            releaseKey,
            auditId
          )
      )
    )
  ).flat(1);
}
