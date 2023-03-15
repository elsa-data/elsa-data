import { inject, injectable } from "tsyringe";
import e from "../../../../dbschema/edgeql-js";
import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import { releaseGetSpecimenTreeAndFileArtifacts } from "../../../../dbschema/queries";
import { ManifestMasterType } from "./manifest-master-types";
import { transformDbManifestToMasterManifest } from "./manifest-master-helper";
import { transformMasterManifestToHtsgetManifest } from "./manifest-htsget-helper";
import { ManifestHtsgetType } from "./manifest-htsget-types";

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

    // TODO fix exceptions here
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
   */
  public async createMasterManifest(
    executor: Executor,
    releaseKey: string
  ): Promise<ManifestMasterType> {
    const manifest = await releaseGetSpecimenTreeAndFileArtifacts(executor, {
      releaseKey: releaseKey,
    });

    return transformDbManifestToMasterManifest(manifest);
  }

  public async getActiveHtsgetManifest(
    releaseKey: string
  ): Promise<ManifestHtsgetType | null> {
    const masterManifest = await this.getActiveManifest(releaseKey);

    // TODO fix exceptions here
    if (!masterManifest) return null;

    return transformMasterManifestToHtsgetManifest(masterManifest);
  }

  public async createTsvManifest(masterManifest: ManifestMasterType) {}
}
