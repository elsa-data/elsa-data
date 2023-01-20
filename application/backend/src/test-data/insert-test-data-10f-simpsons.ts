import { createFile } from "./test-data-helpers";
import {
  makeTrio,
  CORIELL_CELL_SYSTEM,
  CORIELL_DNA_SYSTEM,
  CORIELL_FAMILY_SYSTEM,
  GIAB_FAMILY_SYSTEM,
  PGP_SYSTEM,
  THOUSAND_GENOMES_SYSTEM,
} from "./insert-test-data-10f-helpers";
import {
  DuoDiseaseSpecificResearchType,
  DuoGeneralResearchUseType,
  DuoGeographicalRestrictionType,
  DuoHealthMedicalBiomedicalResearchType,
  DuoNonCommercialUseOnlyType,
  DuoNotForProfitUseOnlyType,
} from "@umccr/elsa-types";
import { container } from "tsyringe";
import { ElsaSettings } from "../config/elsa-settings";

// we make these identifers as external consts so they can be used as insertion values
// but can also be in test suites for looking up know cases etc

export const SIMPSONS_CASE = "SIMPSONS";

export const BART_SPECIMEN = "NA24385";
export const HOMER_SPECIMEN = "NA24149";
export const MARGE_SPECIMEN = "NA24143";

export const BART_PATIENT_1KGP = "HG002";
export const BART_PATIENT_PGP = "huAA53E0";
export const HOMER_PATIENT_1KGP = "HG003";
export const HOMER_PATIENT_PGP = "hu6E4515";
export const MARGE_PATIENT_1KGP = "HG004";
export const MARGE_PATIENT_PGP = "hu8E87A9";

const SIMPSONS_BASE_S3 = "s3://umccr-10f-data-dev/ASHKENAZIM/";

export const BART_BAM_S3 = `${SIMPSONS_BASE_S3}HG002.bam`;
export const BART_BAI_S3 = `${SIMPSONS_BASE_S3}HG002.bam.bai`;

export const HOMER_BAM_S3 = `${SIMPSONS_BASE_S3}HG003.bam`;
export const HOMER_BAI_S3 = `${SIMPSONS_BASE_S3}HG003.bam.bai`;

export const MARGE_BAM_S3 = `${SIMPSONS_BASE_S3}HG004.bam`;
export const MARGE_BAI_S3 = `${SIMPSONS_BASE_S3}HG004.bam.bai`;

export const SIMPSONS_JOINT_VCF_S3 = `${SIMPSONS_BASE_S3}HG002-HG003-HG004.joint.filter.vcf.gz`;
export const SIMPSONS_JOINT_VCF_CSI_S3 = `${SIMPSONS_BASE_S3}HG002-HG003-HG004.joint.filter.vcf.gz.csi`;

export const SIMPSONS_JOINT_BCF_S3 = `${SIMPSONS_BASE_S3}HG002-HG003-HG004.joint.filter.bcf`;
export const SIMPSONS_JOINT_BCF_CSI_S3 = `${SIMPSONS_BASE_S3}HG002-HG003-HG004.joint.filter.bcf.csi`;

// Samples from an Ashkenazim trio (son HG002-NA24385-huAA53E0, father HG003-NA24149-hu6E4515, and mother HG004-NA24143-hu8E87A9),

/**
 * Creates a set of data representing three of the SIMPSONS family as a trio.
 */
export async function makeSimpsonsTrio() {
  // NOTE: we are still dealing with how to link to a single joint VCF file so for the moment we are
  // making some extra VCF file entries that are not correct (see MARGE and HOMER VCF)
  return await makeTrio(
    {
      "": SIMPSONS_CASE,
      [CORIELL_FAMILY_SYSTEM]: "3140",
      [GIAB_FAMILY_SYSTEM]: "ASHKENAZIM",
    },
    [
      {
        code: "DUO:0000006",
      } as DuoHealthMedicalBiomedicalResearchType,
    ],
    // Male	45 YR	White
    {
      "": ["BART", "BARTHOLOMEW"],
      [THOUSAND_GENOMES_SYSTEM]: BART_PATIENT_1KGP,
      [PGP_SYSTEM]: BART_PATIENT_PGP,
    },
    {
      [CORIELL_DNA_SYSTEM]: BART_SPECIMEN,
      [CORIELL_CELL_SYSTEM]: "GM24385",
    },
    "male",
    [
      createFile(
        SIMPSONS_JOINT_VCF_S3,
        7732022,
        "22557caf3f2e2d27d8d1c6e4ea893ece", // pragma: allowlist secret
        "22557caf3f2e2d27d8d1c6e4ea893ece", // pragma: allowlist secret
        "05d0e321052ae1c59eda9ce9e6691304dbafc214" // pragma: allowlist secret
      ),
      createFile(
        SIMPSONS_JOINT_VCF_CSI_S3,
        294561,
        "ce6bc9942886ba3eb8cd08481a23cb7a", // pragma: allowlist secret
        "ce6bc9942886ba3eb8cd08481a23cb7a", // pragma: allowlist secret
        "c317a8d655556b65f01abc8efd0218f244617330" // pragma: allowlist secret
      ),
    ],
    [
      createFile(
        BART_BAM_S3,
        10339494500,
        "9496f3e08943da4639b6abd9825e43d9-602", // pragma: allowlist secret
        "2395ff505be3c38744e0473f6daf1389", // pragma: allowlist secret
        "33461fd2288e50b1ab9a04eb5f9436d148a8d5ea" // pragma: allowlist secret
      ),
      createFile(
        BART_BAI_S3,
        3694104,
        "3e883b2d65c81ef9d206413a96b291f7", // pragma: allowlist secret
        "3e883b2d65c81ef9d206413a96b291f7", // pragma: allowlist secret
        "405d09e0d303293832564f20d79619cfb67e06a9" // pragma: allowlist secret
      ),
    ],
    [
      {
        code: "DUO:0000007",
        // inherited auditory system disease
        diseaseSystem:
          container.resolve<ElsaSettings>("Settings").mondoSystem.uri,
        diseaseCode: "MONDO:0037940",
        // also SCTID:362991006
        modifiers: [
          { code: "DUO:0000045" } as DuoNotForProfitUseOnlyType,
          {
            code: "DUO:0000022",
            regions: ["AU"],
          } as DuoGeographicalRestrictionType,
        ],
      } as DuoDiseaseSpecificResearchType,
      {
        code: "DUO:0000042",
        modifiers: [{ code: "DUO:0000046" } as DuoNonCommercialUseOnlyType],
      } as DuoGeneralResearchUseType,
    ],
    [],
    // Male	90 YR	White	Unknown
    {
      "": "HOMER",
      [THOUSAND_GENOMES_SYSTEM]: HOMER_PATIENT_1KGP,
      [PGP_SYSTEM]: HOMER_PATIENT_PGP,
    },
    {
      [CORIELL_DNA_SYSTEM]: HOMER_SPECIMEN,
      [CORIELL_CELL_SYSTEM]: "GM24149",
    },
    [
      createFile(
        "HOMER" + SIMPSONS_JOINT_VCF_S3,
        7732022,
        "22557caf3f2e2d27d8d1c6e4ea893ece", // pragma: allowlist secret
        "22557caf3f2e2d27d8d1c6e4ea893ece", // pragma: allowlist secret
        "05d0e321052ae1c59eda9ce9e6691304dbafc214" // pragma: allowlist secret
      ),
      createFile(
        "HOMER" + SIMPSONS_JOINT_VCF_CSI_S3,
        294561,
        "ce6bc9942886ba3eb8cd08481a23cb7a", // pragma: allowlist secret
        "ce6bc9942886ba3eb8cd08481a23cb7a", // pragma: allowlist secret
        "c317a8d655556b65f01abc8efd0218f244617330" // pragma: allowlist secret
      ),
    ],
    [
      createFile(
        HOMER_BAM_S3,
        8969726632,
        "9b2fed11bfcadcb906cfd3536e6448cf-523", // pragma: allowlist secret
        "471ba823e7778c0533c3b12d244a6c17", // pragma: allowlist secret
        "b4569180234276ec31016abe6170ea65afa8db53" // pragma: allowlist secret
      ),
      createFile(
        HOMER_BAI_S3,
        3577848,
        "3d86247fbec93b9ae05ef2f00482a988", // pragma: allowlist secret
        "3d86247fbec93b9ae05ef2f00482a988", // pragma: allowlist secret
        "9c7d43f98dbea84a836b1edb02ce5c769ae0254e" // pragma: allowlist secret
      ),
    ],
    [],
    [],
    // Female	74 YR	White	Unknown
    {
      "": "MARGE",
      [THOUSAND_GENOMES_SYSTEM]: MARGE_PATIENT_1KGP,
      [PGP_SYSTEM]: MARGE_PATIENT_PGP,
    },
    {
      [CORIELL_DNA_SYSTEM]: MARGE_SPECIMEN,
      [CORIELL_CELL_SYSTEM]: "GM24143",
    },
    [
      createFile(
        "MARGE" + SIMPSONS_JOINT_VCF_S3,
        7732022,
        "22557caf3f2e2d27d8d1c6e4ea893ece", // pragma: allowlist secret
        "22557caf3f2e2d27d8d1c6e4ea893ece", // pragma: allowlist secret
        "05d0e321052ae1c59eda9ce9e6691304dbafc214" // pragma: allowlist secret
      ),
      createFile(
        "MARGE" + SIMPSONS_JOINT_VCF_CSI_S3,
        294561,
        "ce6bc9942886ba3eb8cd08481a23cb7a", // pragma: allowlist secret
        "ce6bc9942886ba3eb8cd08481a23cb7a", // pragma: allowlist secret
        "c317a8d655556b65f01abc8efd0218f244617330" // pragma: allowlist secret
      ),
    ],
    [
      createFile(
        MARGE_BAM_S3,
        10188721080,
        "6f01f2b51e2012a70647bbaa6f783301-594", // pragma: allowlist secret
        "bdbab239182fbb42f8e2c1134269d8ba", // pragma: allowlist secret
        "f31fe537f5dcd99dce30d760308a2c9f50e5185d" // pragma: allowlist secret
      ),
      createFile(
        MARGE_BAI_S3,
        3681456,
        "fe73771153d3282cc0558dfd772b6c76", // pragma: allowlist secret
        "fe73771153d3282cc0558dfd772b6c76", // pragma: allowlist secret
        "0961940743e8bc9863518d8010947093ac439ae3" // pragma: allowlist secret
      ),
    ],
    [],
    []
  );
}
