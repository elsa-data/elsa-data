import e from "../../../dbschema/edgeql-js";
import {
  createArtifacts,
  createFile,
  makeSystemlessIdentifierArray,
} from "../util/test-data-helpers";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import {
  AustralianGenomicsDirectoryStructure,
  AustralianGenomicsDirectoryStructureObject,
} from "../aws-mock/add-s3-mocks-for-in-memory";
import { masterCases10g, MasterRareDiseaseCase } from "./teng-master-data";

export const TENG_URI = "urn:fdc:umccr.org:2022:dataset/10g";

export const TENG_DESCRIPTION = "UMCCR 10G";

/**
 * The 10G dataset is a subset of the 1000 genomes data but artificially put into a structure
 * to test specific areas of data sharing.
 *
 * NOTE this is a legacy way of inserting the 10G dataset that is used for dev/test
 * work. For actual demonstrations of Elsa there is a mechanism that utilises the
 * Australian Genomics dataset importer in "demo" mode.
 */
export async function insert10G(dc: DependencyContainer): Promise<string> {
  const { settings, logger, edgeDbClient } = getServices(dc);

  // upsert our record of this dataset in the database
  // (this is needed to hang all the actual cases records off this record)
  await e
    .insert(e.dataset.Dataset, {
      uri: TENG_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("10G"),
      description: TENG_DESCRIPTION,
      cases: e.set(),
    })
    .unlessConflict((ds) => ({
      on: ds.uri,
      else: e.update(ds, () => ({
        set: {
          description: TENG_DESCRIPTION,
        },
      })),
    }))
    .run(edgeDbClient);

  const makeCase = async (masterCase: MasterRareDiseaseCase) => {
    const s3Artifacts = await createArtifacts(
      [],
      createFile(
        `s3://umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.bam`,
        masterCase.bamSize,
        masterCase.bamEtag,
        masterCase.bamMd5,
      ),
      createFile(
        `s3://umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.bam.bai`,
        0,
      ),
      createFile(
        `s3://umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz`,
        masterCase.vcfSize,
        masterCase.vcfEtag,
        masterCase.vcfMd5,
      ),
      createFile(
        `s3://umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz.tbi`,
        0,
      ),
      [],
    );
    const gsArtifacts = await createArtifacts(
      [],
      createFile(
        `gs://10gbucket/${masterCase.specimenId}/${masterCase.specimenId}.bam`,
        masterCase.bamSize,
        undefined,
        masterCase.bamMd5,
      ),
      createFile(
        `gs://10gbucket/${masterCase.specimenId}/${masterCase.specimenId}.bam.bai`,
        0,
      ),
      createFile(
        `gs://10gbucket/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz`,
        masterCase.vcfSize,
        undefined,
        masterCase.vcfMd5,
      ),
      createFile(
        `gs://10gbucket/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz.tbi`,
        0,
      ),
      [],
    );
    const r2Artifacts = await createArtifacts(
      [],
      undefined,
      undefined,
      createFile(
        `r2://75cd1b191bb75176cc5418ad2878db39/umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz`, // pragma: allowlist secret
        masterCase.vcfSize,
        undefined,
        masterCase.vcfMd5,
      ),
      createFile(
        `r2://75cd1b191bb75176cc5418ad2878db39/umccr-10g-data-dev//${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz.tbi`, // pragma: allowlist secret
        0,
      ),
      [],
    );

    return e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeSystemlessIdentifierArray(masterCase.caseId),
      patients: e.insert(e.dataset.DatasetPatient, {
        sexAtBirth: masterCase.patientSexAtBirth,
        externalIdentifiers: makeSystemlessIdentifierArray(
          masterCase.patientId,
        ),
        consent:
          masterCase.patientConsentJsons &&
          masterCase.patientConsentJsons.length > 0
            ? e.insert(e.consent.Consent, {
                statements: e.set(
                  ...masterCase.patientConsentJsons.map((pc) =>
                    e.insert(e.consent.ConsentStatementDuo, {
                      dataUseLimitation: pc,
                    }),
                  ),
                ),
              })
            : undefined,
        specimens: e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeSystemlessIdentifierArray(
            masterCase.specimenId,
          ),
          consent:
            masterCase.specimenConsentJsons &&
            masterCase.specimenConsentJsons.length > 0
              ? e.insert(e.consent.Consent, {
                  statements: e.set(
                    ...masterCase.specimenConsentJsons.map((sc) =>
                      e.insert(e.consent.ConsentStatementDuo, {
                        dataUseLimitation: sc,
                      }),
                    ),
                  ),
                })
              : undefined,
          artifacts: e.op(
            e.op(s3Artifacts, "union", gsArtifacts),
            "union",
            r2Artifacts,
          ),
        }),
      }),
    });
  };

  const cases: any[] = [];

  for (const c of masterCases10g) {
    cases.push(await makeCase(c));
  }

  await e
    .update(e.dataset.Dataset, (ds) => ({
      filter: e.op(ds.uri, "=", TENG_URI),
      set: {
        cases: e.set(...cases),
        updatedDateTime: e.datetime_current(),
      },
    }))
    .run(edgeDbClient);

  return TENG_URI;
}

/**
 * Creates a fake directory structure - according to the Australian Genomics data loader rules -
 * that wraps a directory holding the 10G dataset.
 *
 * In order to simulate dataset 'updates' - it returns two "Directory Structures" - the first
 * of the array representing an 'initial' state - and the second representing a 'follow up'
 * state. If you just want to install the full dataset then you can just use the second result.
 */
export async function australianGenomicsDirectoryStructureFor10G(): Promise<
  AustralianGenomicsDirectoryStructure[]
> {
  // NOTE we artificially introduce the data arriving in two phases.. i.e. as if they have been
  //      submitted in two separate submission batches from the labs
  // Phase2 contains all the files from phase1 (i.e. it is meant to be representing a bucket that is being
  // filled cumulatively)
  // our rules for what goes in which batch is arbitrary - I've chosen the number of zeros in the sample id!
  // 2 or more 00s are phase1

  const phase1DirPrefix = "2021-01";

  const phase1Dirs: AustralianGenomicsDirectoryStructure = {
    files: [],
    fileContent: {},
  };

  const phase2DirPrefix = "2021-08";

  const phase2Dirs: AustralianGenomicsDirectoryStructure = {
    files: [],
    fileContent: {},
  };

  // an example manifest for AG
  // checksum	filename	agha_study_id
  // md5md5md5md5md5md5md5md5md5md5md	ABCD.individual.norm.vep.post_filter.vcf.gz	A9133026
  // md5md5md5md5md5md5md5md5md5md5md	ABCD.individual.norm.vep.post_filter.vcf.gz.tbi	A9133026
  // md5md5md5md5md5md5md5md5md5md5md	GHHA.bam	A9133003
  // md5md5md5md5md5md5md5md5md5md5md	GHHA.bam.bai	A9133003
  // md5md5md5md5md5md5md5md5md5md5md	GHHA.individual.norm.vcf.gz	A9133003
  // md5md5md5md5md5md5md5md5md5md5md	GHHA.individual.norm.vcf.gz.tbi	A9133003
  // md5md5md5md5md5md5md5md5md5md5md	RTYU.individual.norm.vcf.gz	A9133008
  // md5md5md5md5md5md5md5md5md5md5md	RTYU.individual.norm.vcf.gz.tbi	A9133008
  let phase1Manifest: string = "checksum\tfilename\tagha_study_id\n";
  let phase2Manifest: string = "checksum\tfilename\tagha_study_id\n";

  // some boilerplate that pushes the correct file structures from a case - and then returns a string to attach
  // to the relevant manifest
  const pushCase = (
    files: AustralianGenomicsDirectoryStructureObject[],
    folder: string,
    case_: MasterRareDiseaseCase,
  ): string => {
    const bamName = `${case_.specimenId}.bam`;
    const baiName = `${case_.specimenId}.bam.bai`;
    const vcfName = `${case_.specimenId}.individual.norm.vep.vcf.gz`;
    const tbiName = `${case_.specimenId}.individual.norm.vep.vcf.gz.tbi`;

    files.push({
      path: `${folder}/${bamName}`,
      etag: `${case_.bamEtag}`,
      size: case_.bamSize,
    });
    files.push({
      path: `${folder}/${baiName}`,
      // TBD introduce size and etag for indexes
      etag: `0000000000000000000000000000000000`,
      size: 128,
    });
    files.push({
      path: `${folder}/${vcfName}`,
      etag: `${case_.vcfEtag}`,
      size: case_.vcfSize,
    });
    files.push({
      path: `${folder}/${tbiName}`,
      // TBD introduce size and etag for indexes
      etag: `0000000000000000000000000000000000`,
      size: 78,
    });

    return (
      `${case_.bamMd5}\t${bamName}\t${case_.patientId}\n` +
      `0000000000000000000000000000000000\t${baiName}\t${case_.patientId}\n` +
      `${case_.vcfMd5}\t${vcfName}\t${case_.patientId}\n` +
      `0000000000000000000000000000000000\t${tbiName}\t${case_.patientId}\n`
    );
  };

  for (const m of masterCases10g) {
    // arbitrary (specimen ids with two zeros!) decide this is in phase 1 - which is about 7 of the 10 cases
    if (m.specimenId.includes("00")) {
      const m1 = pushCase(phase1Dirs.files, phase1DirPrefix, m);
      // NOTE so these are phase 1 files - but we are putting into the list of files for phase2..
      // they correctly need to be in the phase1 folder
      pushCase(phase2Dirs.files, phase1DirPrefix, m);
      // the manifest ONLY represents the files in the folder though
      phase1Manifest += m1;
    } else {
      // these ones only go into the second phase manifest
      phase2Manifest += pushCase(phase2Dirs.files, phase2DirPrefix, m);
    }
  }

  // we need to make records (and content) for the manifests
  const manifest1Path = `${phase1DirPrefix}/manifest.txt`;
  const manifest2Path = `${phase2DirPrefix}/manifest.txt`;

  phase1Dirs.files.push({
    path: manifest1Path,
    etag: `0000000000000000000000000000000000`,
    size: phase1Manifest.length,
  });
  phase1Dirs.fileContent[manifest1Path] = phase1Manifest;

  // NOTING of course that the phase 2 has BOTH manifests - phase 2 is not a single folder - it is both folders
  phase2Dirs.files.push({
    path: manifest1Path,
    etag: `0000000000000000000000000000000000`,
    size: phase1Manifest.length,
  });
  phase2Dirs.files.push({
    path: manifest2Path,
    etag: `0000000000000000000000000000000000`,
    size: phase2Manifest.length,
  });
  phase2Dirs.fileContent[manifest1Path] = phase1Manifest;
  phase2Dirs.fileContent[manifest2Path] = phase2Manifest;

  return [phase1Dirs, phase2Dirs];
}
