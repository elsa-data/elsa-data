import {
  collapseExternalIds,
  doRoleInReleaseCheck,
  getReleaseInfo,
} from "./helpers";
import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import { artifactFilesForSpecimensQuery } from "../db/artifact-queries";
import { AuthenticatedUser } from "../authenticated-user";
import { UserService } from "./user-service";
import { ManifestBucketKeyObjectType } from "./manifests/manifest-bucket-key-types";

// note that we are processing here every artifact that is accessible from
// the chosen specimens
// below we apply some simple logic that will rule out classes of artifacts
// based on the isAllowedReadData, isAllowedVariantData etc
export const unpackFileArtifact = (
  fileArtifact: any,
  includeReadData: boolean = true,
  includeVariantData: boolean = true,
): Pick<
  ManifestBucketKeyObjectType,
  | "artifactId"
  | "objectType"
  | "objectSize"
  | "md5"
  | "objectStoreUrl"
  | "objectStoreProtocol"
  | "objectStoreBucket"
  | "objectStoreKey"
  | "objectStoreSigned"
>[] => {
  const getMd5 = (checksums: any[]): string => {
    for (const c of checksums || []) {
      if (c.type === "MD5") return c.value;
    }
    return "";
  };

  const getRaw = (): Pick<
    ManifestBucketKeyObjectType,
    "artifactId" | "md5" | "objectSize" | "objectStoreUrl" | "objectType"
  >[] => {
    const rawArray = [];

    if (includeReadData) {
      if (fileArtifact.bclFile) {
        rawArray.push({
          objectType: "BCL",
          objectStoreUrl: fileArtifact.bclFile.url,
          objectSize: fileArtifact.bclFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.bclFile.checksums),
        });
      }
      if (fileArtifact.forwardFile) {
        rawArray.push({
          objectType: "FASTQ",
          objectStoreUrl: fileArtifact.forwardFile.url,
          objectSize: fileArtifact.forwardFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.forwardFile.checksums),
        });
      }
      if (fileArtifact.reverseFile) {
        rawArray.push({
          objectType: "FASTQ",
          objectStoreUrl: fileArtifact.reverseFile.url,
          objectSize: fileArtifact.reverseFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.reverseFile.checksums),
        });
      }
      if (fileArtifact.bamFile) {
        rawArray.push({
          objectType: "BAM",
          objectStoreUrl: fileArtifact.bamFile.url,
          objectSize: fileArtifact.bamFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.bamFile.checksums),
        });
      }
      if (fileArtifact.baiFile) {
        rawArray.push({
          objectType: "BAM",
          objectStoreUrl: fileArtifact.baiFile.url,
          objectSize: fileArtifact.baiFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.baiFile.checksums),
        });
      }
      if (fileArtifact.cramFile) {
        rawArray.push({
          objectType: "CRAM",
          objectStoreUrl: fileArtifact.cramFile.url,
          objectSize: fileArtifact.cramFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.cramFile.checksums),
        });
      }
      if (fileArtifact.craiFile) {
        rawArray.push({
          objectType: "CRAM",
          objectStoreUrl: fileArtifact.craiFile.url,
          objectSize: fileArtifact.craiFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.craiFile.checksums),
        });
      }
    }

    if (includeVariantData) {
      if (fileArtifact.vcfFile) {
        rawArray.push({
          objectType: "VCF",
          objectStoreUrl: fileArtifact.vcfFile.url,
          objectSize: fileArtifact.vcfFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.vcfFile.checksums),
        });
      }
      if (fileArtifact.tbiFile) {
        rawArray.push({
          objectType: "VCF",
          objectStoreUrl: fileArtifact.tbiFile.url,
          objectSize: fileArtifact.tbiFile.size.toString(),
          artifactId: fileArtifact.id,
          md5: getMd5(fileArtifact.tbiFile.checksums),
        });
      }
    }

    return rawArray;
  };

  return getRaw().map((raw) => {
    // decompose the object URL into protocol, bucket and key
    const match = raw.objectStoreUrl.match(/^([^:]+):\/\/([^\/]+)\/(.+)$/);

    if (!match) {
      throw new Error(`Bad URL format: ${raw.objectStoreUrl}`);
    }

    return {
      ...raw,
      objectStoreProtocol: match[1],
      objectStoreBucket: match[2],
      objectStoreKey: match[3],
    };
  });
};

// TODO possibly this is a 'db' function that could like in that folder
//      it is very close - but it does some 'business' in collapsing identifiers etc
//      maybe reconsider as we either add functionality here or move functionality elsewhere

/**
 * Process the release/specimen information and return a (tabular) list of 'files'
 * for those specimens.
 *
 *
 * @param executor the client or transaction to execute this query in
 * @param specimens the list of (string) ids of the specimens for the release
 * @param includeReadData whether to include BAM/FASTQ etc
 * @param includeVariantData whether to include VCF etc
 * @deprecated
 */
export async function createReleaseFileList(
  executor: Executor,
  specimens: { id: string }[],
  includeReadData: boolean,
  includeVariantData: boolean,
): Promise<ManifestBucketKeyObjectType[]> {
  // a query to retrieve all the files associated with the given specimen ids
  const filesResult = await artifactFilesForSpecimensQuery.run(executor, {
    specimenIds: specimens.map((s) => s.id),
  });

  const entries: ManifestBucketKeyObjectType[] = [];

  for (const f of filesResult) {
    const caseId = collapseExternalIds(f.case_?.externalIdentifiers);
    const patientId = collapseExternalIds(f.patient?.externalIdentifiers);
    const specimenId = collapseExternalIds(f.externalIdentifiers);

    for (const fa of f.artifacts) {
      const unpackedArray = unpackFileArtifact(
        fa,
        includeReadData,
        includeVariantData,
      );

      for (const unpacked of unpackedArray) {
        const entry: ManifestBucketKeyObjectType = {
          caseId: caseId,
          patientId: patientId,
          specimenId: specimenId,
          ...unpacked,
        };

        entries.push(entry);
      }
    }
  }

  return entries;
}

/**
 * Retrieve a list of file objects that are available to the given user
 * for the given release. This function returns *only* raw data from the
 * database - it does not attempt to 'sign urls' etc.
 *
 * @param user
 * @param releaseKey
 * @deprecated
 */
export async function getAllFileRecords(
  edgeDbClient: edgedb.Client,
  userService: UserService,
  user: AuthenticatedUser,
  releaseKey: string,
): Promise<ManifestBucketKeyObjectType[]> {
  const { userRole } = await doRoleInReleaseCheck(
    userService,
    user,
    releaseKey,
  );

  const { releaseSelectedSpecimensQuery, releaseInfo } = await getReleaseInfo(
    edgeDbClient,
    releaseKey,
  );

  return await edgeDbClient.transaction(async (tx) => {
    const releaseSelectedSpecimens =
      await releaseSelectedSpecimensQuery.run(tx);

    return await createReleaseFileList(
      tx,
      releaseSelectedSpecimens,
      releaseInfo.isAllowedReadData,
      releaseInfo.isAllowedVariantData,
    );
  });
}
