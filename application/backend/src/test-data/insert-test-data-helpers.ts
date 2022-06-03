import { createClient } from "edgedb";
import e, { lab } from "../../dbschema/edgeql-js";

const edgeDbClient = createClient();

export function makeSystemlessIdentifier(entry1: string) {
  return e.tuple({ system: "", value: entry1 });
}

/**
 * Make an identifier array (array of tuples) where there is only
 * one entry and it is a identifier with value only (no system)
 * @param entry1
 */
export function makeSystemlessIdentifierArray(entry1: string) {
  return e.array([makeSystemlessIdentifier(entry1)]);
}

/**
 * Make an identifier array (array of tuples) that is empty.
 */
export function makeEmptyIdentifierArray() {
  const tupleArrayType = e.array(e.tuple({ system: e.str, value: e.str }));

  return e.cast(tupleArrayType, e.literal(tupleArrayType, []));
}

export interface File {
  size: number;
  url: string;
  checksums: {
    type: lab.ChecksumType;
    value: string;
  }[];
}

/**
 * Insert artifacts where each has their own pseudo run and analyses
 * and then return a e.set of all of the things inserted.
 *
 * @param vcf
 * @param vcfIndex
 * @param bam
 * @param bamIndex
 * @param fastqs
 */
export async function createArtifacts(
  vcf: File,
  vcfIndex: File,
  bam: File,
  bamIndex: File,
  fastqs: File[][]
) {
  const fastqPair = fastqs.map((fq) =>
    e.insert(e.lab.RunArtifactFastqPair, {
      forwardFile: e.insert(e.lab.File, {
        url: fq[0].url,
        size: fq[0].size,
        checksums: fq[0].checksums,
      }),
      reverseFile: e.insert(e.lab.File, {
        url: fq[1].url,
        size: fq[1].size,
        checksums: fq[1].checksums,
      }),
    })
  );

  // we insert all the fastq pairs as if they are owned by a pseudo-run
  const r1 = await e
    .insert(e.lab.Run, {
      artifactsProduced: e.set(...fastqPair),
    })
    .run(edgeDbClient);

  const r1select = e.select(e.lab.Run.artifactsProduced, (ab) => ({
    filter: e.op(e.uuid(r1.id), "=", ab["<artifactsProduced[is lab::Run]"].id),
  }));

  // we insert all the bams as owned by a pseudo-analysis
  const a1 = await e
    .insert(e.lab.Analyses, {
      pipeline: "A pipeline",
      input: r1select,
      output: e.set(
        e.insert(e.lab.AnalysesArtifactVcf, {
          vcfFile: e.insert(e.lab.File, {
            url: vcf.url,
            size: vcf.size,
            checksums: vcf.checksums,
          }),
          tbiFile: e.insert(e.lab.File, {
            url: vcfIndex.url,
            size: vcfIndex.size,
            checksums: vcfIndex.checksums,
          }),
        }),
        e.insert(e.lab.AnalysesArtifactBam, {
          bamFile: e.insert(e.lab.File, {
            url: bam.url,
            size: bam.size,
            checksums: bam.checksums,
          }),
          baiFile: e.insert(e.lab.File, {
            url: bamIndex.url,
            size: bamIndex.size,
            checksums: bamIndex.checksums,
          }),
        })
      ),
    })
    .run(edgeDbClient);

  const a1select = e.select(e.lab.Analyses.output, (ab) => ({
    filter: e.op(e.uuid(a1.id), "=", ab["<output[is lab::Analyses]"].id),
  }));

  return e.op(r1select, "union", a1select);
}
