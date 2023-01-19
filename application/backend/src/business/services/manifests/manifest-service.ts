import { inject, injectable } from "tsyringe";
import e from "../../../../dbschema/edgeql-js";
import * as edgedb from "edgedb";
import { ManifestType } from "./manifest-types";

@injectable()
export class ManifestService {
  constructor(@inject("Database") private edgeDbClient: edgedb.Client) {}

  /**
   * Return the manifest for this release if present, else return null.
   *
   * NOTE: this has no User on this call because we haven't yet worked out what
   * the caller for this is (another service??).
   *
   * @param releaseId
   */
  public async getActiveManifest(
    releaseId: string
  ): Promise<ManifestType | null> {
    // whilst we are sorting out what exactly our release id should be - this
    // is a simple boundary check that the format is ok according to edgedb
    try {
      await e.uuid(releaseId).run(this.edgeDbClient);
    } catch (e) {
      return null;
    }

    const releaseWithManifest = await e
      .select(e.release.Release, (r) => ({
        id: true,
        activation: {
          manifest: true,
        },
        filter: e.op(r.id, "=", e.uuid(releaseId)),
      }))
      .assert_single()
      .run(this.edgeDbClient);

    if (!releaseWithManifest) return null;

    if (!releaseWithManifest.activation) return null;

    return releaseWithManifest.activation.manifest as ManifestType;
  }
}
