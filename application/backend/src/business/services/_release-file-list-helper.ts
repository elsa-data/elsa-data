import e from "../../../dbschema/edgeql-js";
import { collapseExternalIds } from "./helpers";
import { Executor } from "edgedb";
import * as edgedb from "edgedb";
import { artifactFilesForSpecimensQuery } from "../db/artifact-queries";
import { doRoleInReleaseCheck, getReleaseInfo } from "./helpers";
import { AuthenticatedUser } from "../authenticated-user";
import { UsersService } from "./users-service";

// TODO possibly this is a 'db' function that could like in that folder
//      it is very close - but it does some 'business' in collapsing identifiers etc
//      maybe reconsider as we either add functionality here or move functionality elsewhere

export type ReleaseFileListEntry = {
  caseId: string;
  patientId: string;
  specimenId: string;
  fileType: string;
  size: string;

  objectStoreProtocol: string;
  objectStoreUrl: string;
  objectStoreBucket: string;
  objectStoreKey: string;

  // optional fields depending on what type of access asked for
  objectStoreSigned?: string;

  // optional depending on what checksums have been entered
  md5?: string;
};

/**
 * Process the release/specimen information and return a (tabular) list of 'files'
 * for those specimens.
 *
 *
 * @param executor the client or transaction to execute this query in
 * @param specimens the list of (string) ids of the specimens for the release
 * @param includeReadData whether to include BAM/FASTQ etc
 * @param includeVariantData whether to include VCF etc
 */
export async function createReleaseFileList(
  executor: Executor,
  specimens: { id: string }[],
  includeReadData: boolean,
  includeVariantData: boolean
): Promise<ReleaseFileListEntry[]> {
  // a query to retrieve all the files associated with the given specimen ids
  const filesResult = await artifactFilesForSpecimensQuery.run(executor, {
    specimenIds: specimens.map((s) => s.id),
  });

  const getMd5 = (checksums: any[]): string => {
    for (const c of checksums || []) {
      if (c.type === "MD5") return c.value;
    }
    return "";
  };

  // note that we are processing here every artifact that is accessible from
  // the chosen specimens
  // below we apply some simple logic that will rule out classes of artifacts
  // based on the isAllowedReadData, isAllowedVariantData etc
  const unpackFileArtifact = (
    fileArtifact: any
  ): Pick<
    ReleaseFileListEntry,
    "fileType" | "objectStoreUrl" | "size" | "md5"
  > | null => {
    if (fileArtifact.bclFile) {
      if (!includeReadData) return null;
      return {
        fileType: "BCL",
        objectStoreUrl: fileArtifact.bclFile.url,
        size: fileArtifact.bclFile.size.toString(),
        md5: getMd5(fileArtifact.bclFile.checksums),
      };
    } else if (fileArtifact.forwardFile) {
      if (!includeReadData) return null;
      return {
        fileType: "FASTQ",
        objectStoreUrl: fileArtifact.forwardFile.url,
        size: fileArtifact.forwardFile.size.toString(),
        md5: getMd5(fileArtifact.forwardFile.checksums),
      };
    } else if (fileArtifact.reverseFile) {
      if (!includeReadData) return null;
      return {
        fileType: "FASTQ",
        objectStoreUrl: fileArtifact.reverseFile.url,
        size: fileArtifact.reverseFile.size.toString(),
        md5: getMd5(fileArtifact.reverseFile.checksums),
      };
    } else if (fileArtifact.bamFile) {
      if (!includeReadData) return null;
      return {
        fileType: "BAM",
        objectStoreUrl: fileArtifact.bamFile.url,
        size: fileArtifact.bamFile.size.toString(),
        md5: getMd5(fileArtifact.bamFile.checksums),
      };
    } else if (fileArtifact.baiFile) {
      if (!includeReadData) return null;
      return {
        fileType: "BAM",
        objectStoreUrl: fileArtifact.baiFile.url,
        size: fileArtifact.baiFile.size.toString(),
        md5: getMd5(fileArtifact.baiFile.checksums),
      };
    } else if (fileArtifact.cramFile) {
      if (!includeReadData) return null;
      return {
        fileType: "CRAM",
        objectStoreUrl: fileArtifact.cramFile.url,
        size: fileArtifact.cramFile.size.toString(),
        md5: getMd5(fileArtifact.cramFile.checksums),
      };
    } else if (fileArtifact.craiFile) {
      if (!includeReadData) return null;
      return {
        fileType: "CRAM",
        objectStoreUrl: fileArtifact.craiFile.url,
        size: fileArtifact.craiFile.size.toString(),
        md5: getMd5(fileArtifact.craiFile.checksums),
      };
    } else if (fileArtifact.vcfFile) {
      if (!includeVariantData) return null;
      return {
        fileType: "VCF",
        objectStoreUrl: fileArtifact.vcfFile.url,
        size: fileArtifact.vcfFile.size.toString(),
        md5: getMd5(fileArtifact.vcfFile.checksums),
      };
    } else if (fileArtifact.tbiFile) {
      if (!includeVariantData) return null;
      return {
        fileType: "VCF",
        objectStoreUrl: fileArtifact.tbiFile.url,
        size: fileArtifact.tbiFile.size.toString(),
        md5: getMd5(fileArtifact.tbiFile.checksums),
      };
    }
    return null;
  };

  const entries: ReleaseFileListEntry[] = [];

  for (const f of filesResult) {
    const caseId = collapseExternalIds(f.case_?.externalIdentifiers);
    const patientId = collapseExternalIds(f.patient?.externalIdentifiers);
    const specimenId = collapseExternalIds(f.externalIdentifiers);

    for (const fa of f.artifacts) {
      const unpacked = unpackFileArtifact(fa);
      if (unpacked === null) {
        continue;
      }

      // decompose the object URL into protocol, bucket and key
      const match = unpacked.objectStoreUrl.match(
        /^([^:]+):\/\/([^\/]+)\/(.+)$/
      );

      if (!match) {
        throw new Error(`Bad URL format: ${unpacked.objectStoreUrl}`);
      }

      const entry: ReleaseFileListEntry = {
        caseId: caseId,
        patientId: patientId,
        specimenId: specimenId,
        objectStoreProtocol: match[1],
        objectStoreBucket: match[2],
        objectStoreKey: match[3],
        ...unpacked,
      };

      entries.push(entry);
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
 */
export async function getAllFileRecords(
  edgeDbClient: edgedb.Client,
  usersService: UsersService,
  user: AuthenticatedUser,
  releaseKey: string
): Promise<ReleaseFileListEntry[]> {
  const { userRole } = await doRoleInReleaseCheck(
    usersService,
    user,
    releaseKey
  );

  const { releaseSelectedSpecimensQuery, releaseInfo } = await getReleaseInfo(
    edgeDbClient,
    releaseKey
  );

  return await edgeDbClient.transaction(async (tx) => {
    const releaseSelectedSpecimens = await releaseSelectedSpecimensQuery.run(
      tx
    );

    return await createReleaseFileList(
      tx,
      releaseSelectedSpecimens,
      releaseInfo.isAllowedReadData,
      releaseInfo.isAllowedVariantData
    );
  });
}
