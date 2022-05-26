import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";

const client = edgedb.createClient();

export function makeSystemlessIdentifier(entry1: string) {
  return e.tuple({ system: "", value: entry1 });
}

export function makeSystemlessIdentifierArray(entry1: string) {
  return e.array([e.tuple({ system: "", value: entry1 })]);
}

export function makeEmptyIdentifierArray() {
  //const identifierTupleType = e.tuple({ system: e.str, value: e.str });

  //return e.literal(identifierTupleType);

  return e.array([e.tuple({ system: "", value: "" })]);
}

export type FastqPair = [r1: string, r2: string];

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
  vcfIndex: string,
  bam: string,
  bamIndex: string,
  fastqs: FastqPair[]
) {
  const pairInserts = fastqs.map((fq) =>
    e.insert(e.lab.RunArtifactFastqPair, {
      url: fq[0],
      url_r2: fq[1],
    })
  );

  // we insert all the fastq pairs as if they are owned by a pseudo-run
  const r1 = await e
    .insert(e.lab.Run, {
      artifacts_produced: e.set(...pairInserts),
    })
    .run(client);

  const r1select = e.select(e.lab.Run.artifacts_produced, (ab) => ({
    filter: e.op(e.uuid(r1.id), "=", ab["<artifacts_produced[is lab::Run]"].id),
  }));

  // we insert all the bams as owned by a pseudo-analysis
  const a1 = await e
    .insert(e.lab.Analyses, {
      pipeline: "A pipeline",
      input: r1select,
      output: e.set(
        e.insert(e.lab.AnalysesArtifactVcf, {
          url: vcf,
          url_tbi: vcfIndex,
        }),
        e.insert(e.lab.AnalysesArtifactBam, {
          url: bam,
          url_bai: bamIndex,
        })
      ),
    })
    .run(client);

  const a1select = e.select(e.lab.Analyses.output, (ab) => ({
    filter: e.op(e.uuid(a1.id), "=", ab["<output[is lab::Analyses]"].id),
  }));

  return e.op(r1select, "union", a1select);
}
