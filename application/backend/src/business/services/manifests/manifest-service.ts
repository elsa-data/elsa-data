import { inject, injectable } from "tsyringe";
import e from "../../../../dbschema/edgeql-js";
import * as edgedb from "edgedb";
import { releaseGetSpecimenTreeAndFileArtifacts } from "../../../../dbschema/queries";
import _ from "lodash";
import { Executor } from "edgedb";

export type ManifestMasterType = Awaited<
  ReturnType<typeof releaseGetSpecimenTreeAndFileArtifacts>
>;

const S3_PREFIX = "s3://";
const GS_PREFIX = "gs://";
const R2_PREFIX = "r2://";

@injectable()
export class ManifestService {
  constructor(@inject("Database") private edgeDbClient: edgedb.Client) {}

  /**
   * Return the manifest for this release if present, else return null.
   *
   * NOTE: this has no User on this call because we haven't yet worked out what
   * the caller for this is (another service??).
   *
   * @param releaseKey
   */
  public async getActiveManifest(
    releaseKey: string
  ): Promise<ManifestMasterType | null> {
    const releaseWithManifest = await e
      .select(e.release.Release, (r) => ({
        id: true,
        activation: {
          manifest: true,
        },
        filter: e.op(r.releaseKey, "=", releaseKey),
      }))
      .assert_single()
      .run(this.edgeDbClient);

    if (!releaseWithManifest) return null;

    if (!releaseWithManifest.activation) return null;

    return releaseWithManifest.activation.manifest as ManifestMasterType;
  }

  /**
   * Create a structured/tree manifest for the data included in a release.
   * The job of the manifest is to give the structure of the data and enough
   * ids/file paths to enable a user with the manifest to understand where the files
   * are and how they relate to each other.
   *
   * The use case for this particular function is to provide a master data structure
   * for all other file manifest creation (i.e. htsget manifests, CSV manifests)
   *
   * @param executor
   * @param releaseKey the release whose selected entries should go into the manifest
   * @param includeReadData whether to include BAM access
   * @param includeVariantData whether to include VCF access
   * @param includeS3Access whether to allow files stored in S3
   * @param includeGSAccess whether to allow files stored in GS
   * @param includeR2Access whether to allow files stored in R2
   */
  public async createMasterManifest(
    executor: Executor,
    releaseKey: string,
    includeReadData: boolean,
    includeVariantData: boolean,
    includeS3Access: boolean,
    includeGSAccess: boolean,
    includeR2Access: boolean
  ): Promise<ManifestMasterType> {
    const manifest = await releaseGetSpecimenTreeAndFileArtifacts(executor, {
      releaseKey: releaseKey,
    });

    // TODO prune/collapse externalIdentifiers if we had rules about how they need to be processed

    // tests artifact files for their cloud location against our sharing rules
    const matchLocation = (url?: string): boolean => {
      if (_.isString(url)) {
        if (url.startsWith(S3_PREFIX) && includeS3Access) return true;
        if (url.startsWith(GS_PREFIX) && includeGSAccess) return true;
        if (url.startsWith(R2_PREFIX) && includeR2Access) return true;
      }
      return false;
    };

    // we need to prune the manifest of all files that we should not be giving out access to
    // (according to our includeReadData etc)

    // NOTE: we are currently working around an EdgeDb generate issue which insists that artifact
    // fields like bamFile are mandatory when clearly the query makes them optional

    // downstream we should always be checking these ("if (a.bamFile)") - so once the generator typing
    // is fixed this should all just easily resolve here

    for (const specimen of manifest.specimenList) {
      const allowedArtifacts = [];
      for (const a of specimen.artifacts) {
        let removeBcl = true,
          removeFastq = true,
          removeBam = true,
          removeCram = true,
          removeVcf = true;

        if (includeReadData) {
          // need to determine which of the artifact types (bam/cram etc) we are - and then whether our
          // storage/cloud location matches our desired sharing rules

          // our default rule is that we WILL REMOVE - here we are looking for reasons why
          // we should keep the fields
          if (a.bclFile) {
            if (matchLocation(a.bclFile.url)) removeBcl = false;
          }

          if (a.forwardFile && a.reverseFile) {
            if (
              matchLocation(a.forwardFile.url) &&
              matchLocation(a.reverseFile.url)
            )
              removeFastq = false;
          }

          if (a.bamFile && a.baiFile) {
            if (matchLocation(a.bamFile.url) && matchLocation(a.baiFile.url))
              removeBam = false;
          }

          if (a.cramFile && a.craiFile) {
            if (matchLocation(a.cramFile.url) && matchLocation(a.craiFile.url))
              removeCram = false;
          }
        }

        if (includeVariantData) {
          if (a.vcfFile && a.tbiFile) {
            if (matchLocation(a.vcfFile.url) && matchLocation(a.tbiFile.url))
              removeVcf = false;
          }
        }

        // once we've done all the above logic we will have some clear instructions that tell us how
        // to fix up the artifact record
        if (removeBcl) delete (a as any).bclFile;
        if (removeFastq) {
          delete (a as any).forwardFile;
          delete (a as any).reverseFile;
        }
        if (removeBam) {
          delete (a as any).bamFile;
          delete (a as any).baiFile;
        }
        if (removeCram) {
          delete (a as any).cramFile;
          delete (a as any).craiFile;
        }
        if (removeVcf) {
          delete (a as any).vcfFile;
          delete (a as any).tbiFile;
          delete (a as any).csiFile;
        }

        // if we allowed any file data through then this is an artifact record to keep in the manifest
        if (
          !removeBcl ||
          !removeFastq ||
          !removeBam ||
          !removeCram ||
          !removeVcf
        )
          allowedArtifacts.push(a);
      }

      specimen.artifacts = allowedArtifacts;
    }

    return manifest;
  }

  public async createHtsgetManifest(masterManifest: ManifestMasterType) {}

  public async createTsvManifest(masterManifest: ManifestMasterType) {}
}
