import e from "../../../dbschema/edgeql-js";

/**
 * Return the file artifact records for all the given specimens,
 * including comprehensive identifiers for the specimen/patient/cases.
 *
 * Note we include the EdgeDb ids here - even though they aren't used for
 * the simple file manifests, just in case we want to manually join this
 * info across to other EdgeDb query results.
 */
export const artifactFilesForSpecimensQuery = e.params(
  { specimenIds: e.array(e.uuid) },
  ({ specimenIds }) =>
    e.select(e.dataset.DatasetSpecimen, (rs) => ({
      id: true,
      externalIdentifiers: true,
      patient: {
        id: true,
        externalIdentifiers: true,
      },
      case_: {
        id: true,
        externalIdentifiers: true,
      },
      dataset: {
        id: true,
        externalIdentifiers: true,
      },
      artifacts: {
        id: true,
        ...e.is(e.lab.ArtifactBcl, {
          bclFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactFastqPair, {
          forwardFile: { url: true, size: true, checksums: true },
          reverseFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactBam, {
          bamFile: { url: true, size: true, checksums: true },
          baiFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactCram, {
          cramFile: { url: true, size: true, checksums: true },
          craiFile: { url: true, size: true, checksums: true },
        }),
        ...e.is(e.lab.ArtifactVcf, {
          vcfFile: { url: true, size: true, checksums: true },
          tbiFile: { url: true, size: true, checksums: true },
        }),
      },
      filter: e.op(rs.id, "in", e.array_unpack(specimenIds)),
    }))
);
