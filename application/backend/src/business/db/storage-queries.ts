import e from "../../../dbschema/edgeql-js";

export const fileByFileIdQuery = e.params({ uuid: e.uuid }, (params) =>
  e.select(e.storage.File, (file) => ({
    ...e.storage.File["*"],
    filter: e.op(file.id, "=", params.uuid),
  }))
);

export const fileByUrlQuery = e.params({ url: e.str }, (params) =>
  e
    .select(e.storage.File, (file) => ({
      ...e.storage.File["*"],
      filter: e.op(file.url, "ilike", params.url),
    }))
    .assert_single()
);
