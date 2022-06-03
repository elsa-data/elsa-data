import { createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";

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

export type FastqPair = [
  r1: string,
  r2: string,
  r1size: number,
  r2size: number
];

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
  vcf: string,
  vcfSize: number,
  vcfIndex: string,
  bam: string,
  bamSize: number,
  bamIndex: string,
  fastqs: FastqPair[]
) {
  const pairInserts = fastqs.map((fq) =>
    e.insert(e.lab.RunArtifactFastqPair, {
      url: fq[0],
      size: fq[2],
      urlR2: fq[1],
    })
  );

  // we insert all the fastq pairs as if they are owned by a pseudo-run
  const r1 = await e
    .insert(e.lab.Run, {
      artifactsProduced: e.set(...pairInserts),
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
          url: vcf,
          size: vcfSize,
          urlTbi: vcfIndex,
        }),
        e.insert(e.lab.AnalysesArtifactBam, {
          url: bam,
          size: bamSize,
          urlBai: bamIndex,
        })
      ),
    })
    .run(edgeDbClient);

  const a1select = e.select(e.lab.Analyses.output, (ab) => ({
    filter: e.op(e.uuid(a1.id), "=", ab["<output[is lab::Analyses]"].id),
  }));

  return e.op(r1select, "union", a1select);
}
