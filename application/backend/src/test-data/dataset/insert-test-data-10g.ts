import e from "../../../dbschema/edgeql-js";
import {
  createArtifacts,
  createFile,
  makeSystemlessIdentifierArray,
} from "../util/test-data-helpers";
import { DuoLimitationCodedType } from "@umccr/elsa-types";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";

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

  const makeCase = async (masterCase: MasterRareDiseaseCase) => {
    const s3Artifacts = await createArtifacts(
      [],
      createFile(
        `s3://umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.bam`,
        masterCase.bamSize,
        masterCase.bamEtag,
        masterCase.bamMd5
      ),
      createFile(
        `s3://umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.bam.bai`,
        0
      ),
      createFile(
        `s3://umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz`,
        masterCase.vcfSize,
        masterCase.vcfEtag,
        masterCase.vcfMd5
      ),
      createFile(
        `s3://umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz.tbi`,
        0
      ),
      []
    );
    const gsArtifacts = await createArtifacts(
      [],
      createFile(
        `gs://10gbucket/${masterCase.specimenId}/${masterCase.specimenId}.bam`,
        masterCase.bamSize,
        undefined,
        masterCase.bamMd5
      ),
      createFile(
        `gs://10gbucket/${masterCase.specimenId}/${masterCase.specimenId}.bam.bai`,
        0
      ),
      createFile(
        `gs://10gbucket/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz`,
        masterCase.vcfSize,
        undefined,
        masterCase.vcfMd5
      ),
      createFile(
        `gs://10gbucket/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz.tbi`,
        0
      ),
      []
    );
    const r2Artifacts = await createArtifacts(
      [],
      undefined,
      undefined,
      createFile(
        `r2://75cd1b191bb75176cc5418ad2878db39/umccr-10g-data-dev/${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz`, // pragma: allowlist secret
        masterCase.vcfSize,
        undefined,
        masterCase.vcfMd5
      ),
      createFile(
        `r2://75cd1b191bb75176cc5418ad2878db39/umccr-10g-data-dev//${masterCase.specimenId}/${masterCase.specimenId}.hard-filtered.vcf.gz.tbi`, // pragma: allowlist secret
        0
      ),
      []
    );

    return e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeSystemlessIdentifierArray(masterCase.caseId),
      patients: e.insert(e.dataset.DatasetPatient, {
        sexAtBirth: masterCase.patientSexAtBirth,
        externalIdentifiers: makeSystemlessIdentifierArray(
          masterCase.patientId
        ),
        consent:
          masterCase.patientConsentJsons &&
          masterCase.patientConsentJsons.length > 0
            ? e.insert(e.consent.Consent, {
                statements: e.set(
                  ...masterCase.patientConsentJsons.map((pc) =>
                    e.insert(e.consent.ConsentStatementDuo, {
                      dataUseLimitation: pc,
                    })
                  )
                ),
              })
            : undefined,
        specimens: e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeSystemlessIdentifierArray(
            masterCase.specimenId
          ),
          consent:
            masterCase.specimenConsentJsons &&
            masterCase.specimenConsentJsons.length > 0
              ? e.insert(e.consent.Consent, {
                  statements: e.set(
                    ...masterCase.specimenConsentJsons.map((sc) =>
                      e.insert(e.consent.ConsentStatementDuo, {
                        dataUseLimitation: sc,
                      })
                    )
                  ),
                })
              : undefined,
          artifacts: e.op(
            e.op(s3Artifacts, "union", gsArtifacts),
            "union",
            r2Artifacts
          ),
        }),
      }),
    });
  };

  const cases = [];

  for (const c of masterCases10g) {
    cases.push(await makeCase(c));
  }

  await e
    .insert(e.dataset.Dataset, {
      uri: TENG_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("10G"),
      description: "UMCCR 10G",
      cases: e.set(...cases),
    })
    .run(edgeDbClient);

  return TENG_URI;
}

type AustralianGenomicsDirectoryStructureObject = {
  s3Url: string;
  eTag: string;
  size: number;
};

type AustralianGenomicsDirectoryStructure = {
  files: AustralianGenomicsDirectoryStructureObject[];
  fileContent: {
    [f: string]: string;
  };
};

/**
 * Creates a fake directory structure - according to the Australian Genomics data loader rules -
 * that wraps a directory holding the 10G dataset.
 *
 * In order to simulate dataset 'updates' - it returns two "Directory Structures" - the first
 * of the array representing an 'initial' state - and the second representing a 'follow up'
 * state.
 *
 * @param demonstrationStoragePrefix An plausible cloud bucket prefix that will be the fake root of our dataset. Slash terminated. e.g. s3://out-bucket/10G/
 */
export async function australianGenomicsDirectoriesDemoLoaderFor10G(
  demonstrationStoragePrefix: string
): Promise<AustralianGenomicsDirectoryStructure[]> {
  if (!demonstrationStoragePrefix.endsWith("/"))
    throw new Error(
      "The demonstrationStoragePrefix of our demonstration datasets must end in a slash"
    );

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
    case_: MasterRareDiseaseCase
  ): string => {
    // Does not work for singleton cases as it can't establish the pedigrees implied
    //const sexSuffix =
    //  case_.patientSexAtBirth === "male"
    //    ? "_pat"
    //   : case_.patientSexAtBirth === "female"
    //    ? "_mat"
    //    : "";

    const bamName = `${case_.specimenId}.bam`;
    const baiName = `${case_.specimenId}.bam.bai`;
    const vcfName = `${case_.specimenId}.individual.norm.vep.vcf.gz`;
    const tbiName = `${case_.specimenId}.individual.norm.vep.vcf.gz.tbi`;

    const bamUrl = `${demonstrationStoragePrefix}${folder}/${bamName}`;
    const baiUrl = `${demonstrationStoragePrefix}${folder}/${baiName}`;
    const vcfUrl = `${demonstrationStoragePrefix}${folder}/${vcfName}`;
    const tbiUrl = `${demonstrationStoragePrefix}${folder}/${tbiName}`;

    files.push({
      s3Url: bamUrl,
      eTag: `${case_.bamEtag}`,
      size: case_.bamSize,
    });
    files.push({
      s3Url: baiUrl,
      // TBD introduce size and etag for indexes
      eTag: `0000000000000000000000000000000000`,
      size: 128,
    });
    files.push({
      s3Url: vcfUrl,
      eTag: `${case_.vcfEtag}`,
      size: case_.vcfSize,
    });
    files.push({
      s3Url: tbiUrl,
      // TBD introduce size and etag for indexes
      eTag: `0000000000000000000000000000000000`,
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
  const manifest1Url = `${demonstrationStoragePrefix}${phase1DirPrefix}/manifest.txt`;
  const manifest2Url = `${demonstrationStoragePrefix}${phase2DirPrefix}/manifest.txt`;

  phase1Dirs.files.push({
    s3Url: manifest1Url,
    eTag: `0000000000000000000000000000000000`,
    size: phase1Manifest.length,
  });
  phase1Dirs.fileContent[manifest1Url] = phase1Manifest;

  // NOTING of course that the phase 2 has BOTH manifests - phase 2 is not a single folder - it is both folders
  phase2Dirs.files.push({
    s3Url: manifest1Url,
    eTag: `0000000000000000000000000000000000`,
    size: phase1Manifest.length,
  });
  phase2Dirs.files.push({
    s3Url: manifest2Url,
    eTag: `0000000000000000000000000000000000`,
    size: phase2Manifest.length,
  });
  phase2Dirs.fileContent[manifest1Url] = phase1Manifest;
  phase2Dirs.fileContent[manifest2Url] = phase2Manifest;

  return [phase1Dirs, phase2Dirs];
}

type MasterRareDiseaseCase = {
  caseId: string;
  patientId: string;
  patientSexAtBirth: "male" | "female" | "other";
  specimenId: string;
  bamSize: number;
  bamEtag: string;
  bamMd5: string;
  vcfSize: number;
  vcfEtag: string;
  vcfMd5: string;
  patientConsentJsons?: DuoLimitationCodedType[];
  specimenConsentJsons?: DuoLimitationCodedType[];
};

/**
 * The master definition of our 10G dataset. We can turn this direct into
 * db insertions or make a fake AG file based dataset to index/load.
 */
const masterCases10g: MasterRareDiseaseCase[] = [
  {
    caseId: "SINGLETONCHARLES",
    patientId: "CHARLES",
    patientSexAtBirth: "male",
    specimenId: "HG00096",
    bamSize: 51808533335,
    bamEtag: "bfce3cfa4f0265866fae8f7a653cca95-3089", // pragma: allowlist secret
    bamMd5: "63f2b3c6b87c66d114f1e9bae8c35091", // pragma: allowlist secret
    vcfSize: 425745911,
    vcfEtag: "19dca923f52f14af83d410983e46284f-26", // pragma: allowlist secret
    vcfMd5: "54c76df2f55aa5a2450bd874bf488100", // pragma: allowlist secret
    patientConsentJsons: [
      { code: "DUO:0000006", modifiers: [{ code: "DUO:0000045" }] },
    ],
  },
  {
    caseId: "SINGLETONMARY",
    patientId: "MARY",
    patientSexAtBirth: "female",
    specimenId: "HG00097",
    bamSize: 51388476731,
    bamEtag: "06b1c646338fa079dd6d7cb5f9dd67ed-3063", // pragma: allowlist secret
    bamMd5: "a6e072e3831fbdad4b790b9655d03301", // pragma: allowlist secret
    vcfSize: 432160352,
    vcfEtag: "3194220a4ba859ceaa6b8bd7f7db5e14-26", // pragma: allowlist secret
    vcfMd5: "e16865d5a227ff6af6f09ca535db5d92", // pragma: allowlist secret
    patientConsentJsons: [{ code: "DUO:0000006", modifiers: [] }],
    specimenConsentJsons: [
      {
        code: "DUO:0000007",
        // endocrine system disorder
        diseaseSystem: "MONDO",
        diseaseCode: "MONDO:0005151",
        modifiers: [{ code: "DUO:0000045" }],
      },
    ],
  },
  {
    caseId: "SINGLETONJANE",
    patientId: "JANE",
    patientSexAtBirth: "female",
    specimenId: "HG00099",
    bamSize: 60287609330,
    bamEtag: "7f2c808df51490657f374b9d50abf6b1-3594", // pragma: allowlist secret
    bamMd5: "8335ad513b0c22f32d558302448e69c8", // pragma: allowlist secret
    vcfSize: 438966719,
    vcfEtag: "3724127aaee9ca1a94f9b70d67e67a29-27", // pragma: allowlist secret
    vcfMd5: "48c5e1a3e232d4f0f86dc7d5573ee092", // pragma: allowlist secret
  },
  {
    caseId: "SINGLETONKAARINA",
    patientId: "KAARINA",
    patientSexAtBirth: "female",
    specimenId: "HG00171",
    bamSize: 58384944597,
    bamEtag: "5d825ddd05da504698dbeb23d15362a7-6961", // pragma: allowlist secret
    bamMd5: "63510a8e2239cf249ca09713a91a6424", // pragma: allowlist secret
    vcfSize: 437251295,
    vcfEtag: "df373fd8c2d17baabe3ee589c0326fb9-27", // pragma: allowlist secret
    vcfMd5: "9797c64d48fa174fea3b01347e26a308", // pragma: allowlist secret
  },
  {
    caseId: "SINGLETONANNELI",
    patientId: "ANNELI",
    patientSexAtBirth: "female",
    specimenId: "HG00173",
    bamSize: 48040087199,
    bamEtag: "c61c0622eabbc405f06a789cf6ba8fd6-2864", // pragma: allowlist secret
    bamMd5: "c74d331165fe3f38cc761f2a0722ba72", // pragma: allowlist secret
    vcfSize: 429780695,
    vcfEtag: "7d05309c6f6844d905c31be28586a982-26", // pragma: allowlist secret
    vcfMd5: "efbb3a684951c627b82cbd66e84f55c1", // pragma: allowlist secret
  },
  {
    caseId: "SINGLETONMARIA",
    patientId: "MARIA",
    patientSexAtBirth: "female",
    specimenId: "HG00174",
    bamSize: 54237781415,
    bamEtag: "6d7b24a88ef68599a2e0313210b6378c-3233", // pragma: allowlist secret
    bamMd5: "45d0cf732bab4a511a32107740b35a07", // pragma: allowlist secret
    vcfSize: 434759056,
    vcfEtag: "f47ab95a47264f62de13f5365b83eb64-26", // pragma: allowlist secret
    vcfMd5: "be6558787eb497fe2574d3c994e320f9", // pragma: allowlist secret
  },
  {
    caseId: "SINGLETONMELE",
    patientId: "MELE",
    patientSexAtBirth: "male",
    specimenId: "HG01810",
    bamSize: 50762049781,
    bamEtag: "80cbbe8fef18d6aeb340f04295c73478-3026", // pragma: allowlist secret
    bamMd5: "cb7e8611d76ceca501692bd0eafb659d", // pragma: allowlist secret
    vcfSize: 419758367,
    vcfEtag: "7d735cd64a1117d1b862ff3228d7a6e2-26", // pragma: allowlist secret
    vcfMd5: "7917729eda54199c49195c0673692e22", // pragma: allowlist secret
  },
  {
    caseId: "SINGLETONPELANI",
    patientId: "PELANI",
    patientSexAtBirth: "male",
    specimenId: "HG01811",
    bamSize: 50858843268,
    bamEtag: "fc762747742fc6d7c6957570a174585f-3032", // pragma: allowlist secret
    bamMd5: "42cb60acce8b87487dbc4be04029d140", // pragma: allowlist secret
    vcfSize: 419339818,
    vcfEtag: "b257163c3eade1afb78f8bce4d6c89df-25", // pragma: allowlist secret
    vcfMd5: "49de7148a89194b1f706c510a7d1e9e7", // pragma: allowlist secret
  },
  {
    caseId: "SINGLETONDEMBO",
    patientId: "DEMBO",
    patientSexAtBirth: "male",
    specimenId: "HG03432",
    bamSize: 55219679614,
    bamEtag: "c7d2c93155e292acd0a7fdb5c56d83bf-6583", // pragma: allowlist secret
    bamMd5: "d2d47067e22360ebcc7a7eb0c4211f0f", // pragma: allowlist secret
    vcfSize: 534880969,
    vcfEtag: "ae99529fbdfcf1e399e6f7060b2b691e-32", // pragma: allowlist secret
    vcfMd5: "f8777c671b63974c3c0f1f167a57a36d", // pragma: allowlist secret
  },
  {
    caseId: "SINGLETONPAKUTEH",
    patientId: "PAKUTEH",
    patientSexAtBirth: "male",
    specimenId: "HG03433",
    bamSize: 60896676023,
    bamEtag: "7947dd1c25329b90e9cf45372714bbeb-3630", // pragma: allowlist secret
    bamMd5: "65a66f7b1fa663a6c4660e42fb11baf6", // pragma: allowlist secret
    vcfSize: 540694003,
    vcfEtag: "cde09b0694f3cd5cfd014a7500cfc0e9-33", // pragma: allowlist secret
    vcfMd5: "bb80404412db614f2e6a7b9b49ab5977", // pragma: allowlist secret
  },
];
