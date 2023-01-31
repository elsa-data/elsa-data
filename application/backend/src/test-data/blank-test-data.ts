import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";

const edgeDbClient = edgedb.createClient();

/**
 * In the absence of some sort of truncate functionality in edgedb - we explicitly
 * delete all object types in an order that is safe from delete clashes.
 *
 * This is for use in unit tests setups etc to ensure an empty db state.
 */
export async function blankTestData(printDetailsToConsole: boolean = false) {
  // TODO: add a guard such that this can only execute on a local db

  if (printDetailsToConsole)
    console.log(`Removing any existing data in test database`);

  const pedigreeDeleted = await e.delete(e.pedigree.Pedigree).run(edgeDbClient);
  const pedigreeRelationshipDeleted = await e
    .delete(e.pedigree.PedigreeRelationship)
    .run(edgeDbClient);

  const jobsDeleted = await e.delete(e.job.Job).run(edgeDbClient);

  const usersDeleted = await e.delete(e.permission.User).run(edgeDbClient);
  const potentialUsersDeleted = await e
    .delete(e.permission.PotentialUser)
    .run(edgeDbClient);

  const releasesDeleted = await e.delete(e.release.Release).run(edgeDbClient);

  const specimensDeleted = await e
    .delete(e.dataset.DatasetSpecimen)
    .run(edgeDbClient);
  const patientsDeleted = await e
    .delete(e.dataset.DatasetPatient)
    .run(edgeDbClient);
  const casesDeleted = await e.delete(e.dataset.DatasetCase).run(edgeDbClient);
  const datasetsDeleted = await e.delete(e.dataset.Dataset).run(edgeDbClient);
  const consentDeleted = await e.delete(e.consent.Consent).run(edgeDbClient);

  const bclsDeleted = await e.delete(e.lab.ArtifactBcl).run(edgeDbClient);
  const fastqsDeleted = await e
    .delete(e.lab.ArtifactFastqPair)
    .run(edgeDbClient);
  const bamsDeleted = await e.delete(e.lab.ArtifactBam).run(edgeDbClient);
  const cramsDeleted = await e.delete(e.lab.ArtifactCram).run(edgeDbClient);
  const vcfsDeleted = await e.delete(e.lab.ArtifactVcf).run(edgeDbClient);

  const analysesDeleted = await e.delete(e.lab.Analyses).run(edgeDbClient);
  const runsDeleted = await e.delete(e.lab.Run).run(edgeDbClient);
  const submissionsBatchesDeleted = await e
    .delete(e.lab.SubmissionBatch)
    .run(edgeDbClient);

  const filesDeleted = await e.delete(e.storage.File).run(edgeDbClient);

  const releaseAuditDeleted = await e
    .delete(e.audit.ReleaseAuditEvent)
    .run(edgeDbClient);

  const dataAccessAuditDeleted = await e
    .delete(e.audit.DataAccessAuditEvent)
    .run(edgeDbClient);

  if (printDetailsToConsole) {
    console.log(`  ${jobsDeleted.length} job(s)`);
    console.log(
      `  ${usersDeleted.length}/${potentialUsersDeleted.length} user(s)/potential user(s)`
    );

    console.log(`  ${releasesDeleted.length} release(s)`);
    console.log(`  ${releaseAuditDeleted.length} releaseAudit(s)`);
    console.log(`  ${dataAccessAuditDeleted.length} dataAccessAudit(s)`);

    console.log(
      `  ${specimensDeleted.length}/${patientsDeleted.length}/${casesDeleted.length}/${datasetsDeleted.length} dataset specimen(s)/patient(s)/case(s)/set(s)`
    );
    console.log(`  ${consentDeleted.length} consent(s)`);

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

    console.log(`  ${filesDeleted.length} storage file(s)`);

    console.log(`  ${pedigreeDeleted.length} pedigree(s)`);
    console.log(
      `  ${pedigreeRelationshipDeleted.length} pedigree relationship(s)`
    );
  }
}
