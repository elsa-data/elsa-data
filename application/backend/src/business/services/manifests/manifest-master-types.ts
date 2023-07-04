import { releaseGetSpecimenTreeAndFileArtifacts } from "../../../../dbschema/queries";

// TODO currently this master type is derived directly from the edgedb query type - but I question if we should assert more control

export type ManifestMasterType = Awaited<
  ReturnType<typeof releaseGetSpecimenTreeAndFileArtifacts>
>;
