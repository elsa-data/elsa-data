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

// so these identifiers are used both for insertion values - but can also be in test suites for
// looking up know cases etc
export const JETSONS_CASE = "JETSONS";

export const ELROY_SPECIMEN = "NA24631";
export const GEORGE_SPECIMEN = "NA24694";
export const JUDY_SPECIMEN = "NA24695";

export const ELROY_PATIENT_1KGP = "HG005";
export const ELROY_PATIENT_PGP = "hu91BD69";
export const GEORGE_PATIENT_PGP = "huCA017E";
export const JUDY_PATIENT_PGP = "hu38168C";

// Han Chinese trio (son HG005-NA24631-hu91BD69, father NA24694-huCA017E, and mother NA24695-hu38168C) from Personal Genome Project (PGP) are

export async function makeJetsonsTrio() {
  const s3base = "s3://umccr-10f-data-dev/CHINESE/";

  return await makeTrio(
    {
      "": JETSONS_CASE,
      [CORIELL_FAMILY_SYSTEM]: "3150",
      [GIAB_FAMILY_SYSTEM]: "HAN",
    },
    [],
    // Male	33 YR	Chinese
    {
      "": "ELROY",
      [THOUSAND_GENOMES_SYSTEM]: ELROY_PATIENT_1KGP,
      [PGP_SYSTEM]: ELROY_PATIENT_PGP,
    },
    {
      [CORIELL_DNA_SYSTEM]: ELROY_SPECIMEN,
      [CORIELL_CELL_SYSTEM]: "GM24631",
    },
    "male",
    [
      createFile(
        s3base + `${JETSONS_CASE}HG002-HG003-HG004.joint.filter.vcf.gz`,
        1
      ),
      createFile(
        s3base + `${JETSONS_CASE}HG002-HG003-HG004.joint.filter.vcf.gz.csi`,
        1
      ),
    ],
    [createFile(s3base + `.bam`, 1), createFile(s3base + `.bam.bai`, 1)],
    [],
    [],
    // Male	64 YR	Chinese
    // george jetson
    { [PGP_SYSTEM]: GEORGE_PATIENT_PGP },
    {
      [CORIELL_DNA_SYSTEM]: GEORGE_SPECIMEN,
      [CORIELL_CELL_SYSTEM]: "GM24694",
    },
    [
      createFile(
        s3base + `${JETSONS_CASE}HG002-HG003-HG004.joint.filter.vcf.gz`,
        1
      ),
      createFile(
        s3base + `${JETSONS_CASE}HG002-HG003-HG004.joint.filter.vcf.gz.csi`,
        1
      ),
    ],
    [
      createFile(s3base + `${GEORGE_PATIENT_PGP}HG002-HG003-HG004.bam`, 1),
      createFile(s3base + `${GEORGE_PATIENT_PGP}HG002-HG003-HG004.bam.bai`, 1),
    ],
    [],
    [],
    // Female	63 YR	Chinese
    // Judy jetson
    { [PGP_SYSTEM]: JUDY_PATIENT_PGP },
    {
      [CORIELL_DNA_SYSTEM]: JUDY_SPECIMEN,
      [CORIELL_CELL_SYSTEM]: "GM24694",
    },
    [
      createFile(
        s3base + `${JETSONS_CASE}HG002-HG003-HG004.joint.filter.vcf.gz`,
        1
      ),
      createFile(
        s3base + `${JETSONS_CASE}HG002-HG003-HG004.joint.filter.vcf.gz.csi`,
        1
      ),
    ],
    [
      createFile(s3base + `${JUDY_PATIENT_PGP}HG002-HG003-HG004.bam`, 1),
      createFile(s3base + `${JUDY_PATIENT_PGP}HG002-HG003-HG004.bam.bai`, 1),
    ],
    [],
    []
  );
}
