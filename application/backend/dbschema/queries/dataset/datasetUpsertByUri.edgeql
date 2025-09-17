# Upsert a dataset by URI - insert if new, update description if exists
# Used for creating/updating test datasets

insert dataset::Dataset {
  uri := <str>$uri,
  externalIdentifiers := <array<tuple<system: str, value: str>>>$externalIdentifiers,
  description := <str>$description,
  cases := {}
} unless conflict on .uri else (
  update dataset::Dataset set {
    description := <str>$description
  }
)