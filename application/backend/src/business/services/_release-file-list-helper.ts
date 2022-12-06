import e from "../../../dbschema/edgeql-js";
import { collapseExternalIds } from "./helpers";
import { Executor } from "edgedb";

// TODO possibly this is a 'db' function that could like in that folder
//      it is very close - but it does some 'business' in collapsing identifiers etc
//      maybe reconsider as we either add functionality here or move functionality elsewhere

export type ReleaseFileListEntry = {
  caseId: string;
  patientId: string;
  specimenId: string;
  fileType: string;
  size: string;

  // currently only sourcing from AWS S3 but will need to think about this for others
  s3Url: string;
  s3Bucket: string;
  s3Key: string;

  // optional fields depending on what type of access asked for
  s3Signed?: string;

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
  const filesQuery = e.params(
    { specimenIds: e.array(e.uuid) },
    ({ specimenIds }) =>
      e.select(e.dataset.DatasetSpecimen, (rs) => ({
        externalIdentifiers: true,
        patient: {
          externalIdentifiers: true,
        },
        case_: {
          externalIdentifiers: true,
        },
        dataset: {
          externalIdentifiers: true,
        },
        artifacts: {
          ...e.is(e.lab.ArtifactBcl, {
            bclFile: { url: true, size: true, checksums: true },
          }),
          ...e.is(e.lab.ArtifactFastqPair, {
            forwardFile: { url: true, size: true, checksums: true },
            reverseFile: { url: true, size: true, checksums: true },
          }),
          ...e.is(e.lab.ArtifactBam, {
            bamFile: { url: true, size: true, checksums: true },
            baiFile: { url: true, size: true, checksums: true },
          }),
          ...e.is(e.lab.ArtifactCram, {
            cramFile: { url: true, size: true, checksums: true },
            craiFile: { url: true, size: true, checksums: true },
          }),
          ...e.is(e.lab.ArtifactVcf, {
            vcfFile: { url: true, size: true, checksums: true },
            tbiFile: { url: true, size: true, checksums: true },
          }),
        },
        filter: e.op(rs.id, "in", e.array_unpack(specimenIds)),
      }))
  );

  // execute it
  const filesResult = await filesQuery.run(executor, {
    specimenIds: specimens.map((s) => s.id),
  });

  const getMd5 = (checksums: any[]): string => {
    for (const c of checksums || []) {
      if (c.type === "MD5") return c.value;
    }
    return "";
  };

  const entries: ReleaseFileListEntry[] = [];

  for (const f of filesResult) {
    const caseId = collapseExternalIds(f.case_?.externalIdentifiers);
    const patientId = collapseExternalIds(f.patient?.externalIdentifiers);
    const specimenId = collapseExternalIds(f.externalIdentifiers);

    for (const fa of f.artifacts) {
      const entry: Partial<ReleaseFileListEntry> = {
        caseId: caseId,
        patientId: patientId,
        specimenId: specimenId,
        size: "-1",
      };

      // note that we are processing here every artifact that is accessible from
      // the chosen specimens
      // below we apply some simple logic that will rule out classes of artifacts
      // based on the isAllowedReadData, isAllowedVariantData etc

      if (fa.bclFile) {
        if (!includeReadData) continue;
        entry.fileType = "BCL";
        entry.s3Url = fa.bclFile.url;
        entry.size = fa.bclFile.size.toString();
        entry.md5 = getMd5(fa.bclFile.checksums);
      } else if (fa.forwardFile) {
        if (!includeReadData) continue;
        entry.fileType = "FASTQ";
        entry.s3Url = fa.forwardFile.url;
        entry.size = fa.forwardFile.size.toString();
        entry.md5 = getMd5(fa.forwardFile.checksums);
      } else if (fa.reverseFile) {
        if (!includeReadData) continue;
        entry.fileType = "FASTQ";
        entry.s3Url = fa.reverseFile.url;
        entry.size = fa.reverseFile.size.toString();
        entry.md5 = getMd5(fa.reverseFile.checksums);
      } else if (fa.bamFile) {
        if (!includeReadData) continue;
        entry.fileType = "BAM";
        entry.s3Url = fa.bamFile.url;
        entry.size = fa.bamFile.size.toString();
        entry.md5 = getMd5(fa.bamFile.checksums);
      } else if (fa.baiFile) {
        if (!includeReadData) continue;
        entry.fileType = "BAM";
        entry.s3Url = fa.baiFile.url;
        entry.size = fa.baiFile.size.toString();
        entry.md5 = getMd5(fa.baiFile.checksums);
      } else if (fa.cramFile) {
        if (!includeReadData) continue;
        entry.fileType = "CRAM";
        entry.s3Url = fa.cramFile.url;
        entry.size = fa.cramFile.size.toString();
        entry.md5 = getMd5(fa.cramFile.checksums);
      } else if (fa.craiFile) {
        if (!includeReadData) continue;
        entry.fileType = "CRAM";
        entry.s3Url = fa.craiFile.url;
        entry.size = fa.craiFile.size.toString();
        entry.md5 = getMd5(fa.craiFile.checksums);
      } else if (fa.vcfFile) {
        if (!includeVariantData) continue;
        entry.fileType = "VCF";
        entry.s3Url = fa.vcfFile.url;
        entry.size = fa.vcfFile.size.toString();
        entry.md5 = getMd5(fa.vcfFile.checksums);
      } else if (fa.tbiFile) {
        if (!includeVariantData) continue;
        entry.fileType = "VCF";
        entry.s3Url = fa.tbiFile.url;
        entry.size = fa.tbiFile.size.toString();
        entry.md5 = getMd5(fa.tbiFile.checksums);
      } else {
        continue;
      }

      // decompose the S3 url into bucket and key
      const _match = entry.s3Url.match(/^s3?:\/\/([^\/]+)\/?(.*?)$/);

      if (!_match) {
        entry.s3Url = "";
        entry.s3Bucket = "";
        entry.s3Key = "";
        continue;
      } else {
        entry.s3Bucket = _match[1];
        entry.s3Key = _match[2];
      }

      entries.push(entry as ReleaseFileListEntry);
    }
  }

  return entries;
}
