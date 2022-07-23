import e from "../../../dbschema/edgeql-js";

const rs = e
  .select(e.release.Release, (r) => ({
    filter: e.op(r.id, "=", e.uuid("")),
  }))
  .assert_single().datasetUris;

const allReleaseDatasetsQuery = e.params({ releaseId: e.uuid }, (params) =>
  e.select(e.dataset.Dataset, (ds) => ({
    ...e.dataset.Dataset["*"],
    filter: e.op(
      ds.uri,
      "=",
      e.array_unpack(
        e
          .select(e.release.Release, (r) => ({
            filter: e.op(r.id, "=", params.releaseId),
          }))
          .assert_single().datasetUris
      )
    ),
  }))
);
