import { DuoLimitationCodedType } from "@umccr/elsa-types";

/**
 * A master data structure that can represent in memory
 * for rare disease case tests. We fill in this data
 * so we can use it for multiple different loaders
 * and tests.
 */
export type MasterRareDiseaseCase = {
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

export const CHARLES_CASE_SYSTEMLESS = "SINGLETONCHARLES";
export const CHARLES_PATIENT_SYSTEMLESS = "CHARLES";
export const CHARLES_SPECIMEN_SYSTEMLESS = "HG00096";

/**
 * The master definition of our 10G dataset. We can turn this direct into
 * db insertions or make a fake AG file based dataset to index/load.
 */
export const masterCases10g: MasterRareDiseaseCase[] = [
  {
    caseId: CHARLES_CASE_SYSTEMLESS,
    patientId: CHARLES_PATIENT_SYSTEMLESS,
    patientSexAtBirth: "male",
    specimenId: CHARLES_SPECIMEN_SYSTEMLESS,
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
