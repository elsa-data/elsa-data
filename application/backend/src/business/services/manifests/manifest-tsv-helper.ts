import type {
  ManifestBucketKeyObjectType,
  ManifestTsvBodyType,
} from "./manifest-bucket-key-types";
import { ManifestMasterType } from "./manifest-master-types";
import { unpackFileArtifact } from "../_release-file-list-helper";
import { PresignedUrlService } from "../presigned-url-service";
import { getFirstSystemSortedExternalIdentifierValue } from "../helpers";

async function manifestBodyElements(
  datasetSpecimen: any,
  presignedUrlService: PresignedUrlService,
  releaseKey: string,
  auditId: string,
): Promise<ManifestBucketKeyObjectType[]> {
  const artifacts: any[] = datasetSpecimen.artifacts;
  const unpackedFileArtifacts = artifacts.flatMap(
    (a: any) => unpackFileArtifact(a) ?? [],
  );
  const signedFileArtifacts = await Promise.all(
    unpackedFileArtifacts.map(async (f) => ({
      ...f,
      objectStoreSigned: await presignedUrlService.presign(
        releaseKey,
        f.objectStoreProtocol,
        f.objectStoreBucket,
        f.objectStoreKey,
        auditId,
      ),
    })),
  );

  return await Promise.all(
    signedFileArtifacts.map(async (a) => ({
      ...a,
      ...getFirstExternalIds(datasetSpecimen),
    })),
  );
}

export function getFirstExternalIds(datasetSpecimen: any): {
  caseId: string;
  patientId: string;
  specimenId: string;
} {
  return {
    caseId: getFirstSystemSortedExternalIdentifierValue(
      datasetSpecimen.case_.externalIdentifiers,
    ),
    patientId: getFirstSystemSortedExternalIdentifierValue(
      datasetSpecimen.patient.externalIdentifiers,
    ),
    specimenId: getFirstSystemSortedExternalIdentifierValue(
      datasetSpecimen.externalIdentifiers,
    ),
  };
}

export async function transformMasterManifestToTsvManifest(
  masterManifest: ManifestMasterType,
  presignedUrlService: PresignedUrlService,
  releaseKey: string,
  auditId: string,
): Promise<ManifestTsvBodyType> {
  return (
    await Promise.all(
      masterManifest.specimenList.map(
        async (s) =>
          await manifestBodyElements(
            s,
            presignedUrlService,
            releaseKey,
            auditId,
          ),
      ),
    )
  ).flat(1);
}
