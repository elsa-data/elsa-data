import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";

const edgeDbClient = edgedb.createClient();

/**
 * In the absence of some sort of truncate functionality in edgedb - we explicitly
 * delete all object types in an order that is safe from delete classhes.
 */
export async function blankTestData(printDetailsToConsole: boolean = false) {
  // TODO: add a guard such that this can only execute on a local db

  if (printDetailsToConsole)
    console.log(`Removing any existing data in test database`);

  const usersDeleted = await e.delete(e.permission.User).run(edgeDbClient);
  const releasesDeleted = await e.delete(e.release.Release).run(edgeDbClient);
  const specimensDeleted = await e
    .delete(e.dataset.DatasetSpecimen)
    .run(edgeDbClient);
  const patientsDeleted = await e
    .delete(e.dataset.DatasetPatient)
    .run(edgeDbClient);
  const casesDeleted = await e.delete(e.dataset.DatasetCase).run(edgeDbClient);
  const datasetsDeleted = await e.delete(e.dataset.Dataset).run(edgeDbClient);
  const analysesDeleted = await e.delete(e.lab.Analyses).run(edgeDbClient);
  const runsDeleted = await e.delete(e.lab.Run).run(edgeDbClient);
  const submissionsBatchesDeleted = await e
    .delete(e.lab.SubmissionBatch)
    .run(edgeDbClient);
  const bclsDeleted = await e.delete(e.lab.ArtifactBcl).run(edgeDbClient);
  const fastqsDeleted = await e
    .delete(e.lab.ArtifactFastqPair)
    .run(edgeDbClient);
  const bamsDeleted = await e.delete(e.lab.ArtifactBam).run(edgeDbClient);
  const cramsDeleted = await e.delete(e.lab.ArtifactCram).run(edgeDbClient);
  const vcfsDeleted = await e.delete(e.lab.ArtifactVcf).run(edgeDbClient);

  if (printDetailsToConsole) {
    console.log(`  ${usersDeleted.length} user(s)`);

    console.log(`  ${releasesDeleted.length} release(s)`);

    console.log(`  ${specimensDeleted.length} dataset specimen(s)`);
    console.log(`  ${patientsDeleted.length} dataset patient(s)`);
    console.log(`  ${casesDeleted.length} dataset case(s)`);
    console.log(`  ${datasetsDeleted.length} dataset(s)`);

    console.log(`  ${analysesDeleted.length} lab analyses(s)`);
    console.log(`  ${runsDeleted.length} lab run(s)`);
    console.log(
      `  ${submissionsBatchesDeleted.length} lab submission batch(s)`
    );

    console.log(`  ${bclsDeleted.length} lab bcl(s)`);
    console.log(`  ${fastqsDeleted.length} lab fastq(s)`);
    console.log(`  ${bamsDeleted.length} lab bam(s)`);
    console.log(`  ${cramsDeleted.length} lab cram(s)`);
    console.log(`  ${vcfsDeleted.length} lab vcf(s)`);
  }
}
