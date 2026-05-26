# synchonises the NCI Globus Demo dataset
WITH
  doi := <str>$datasetDoi,
  uri := <str>$datasetUri,
  raw_data := <json>$sampleData,

  externalIdentifiers := [ (system:="DOI", value:=doi) ],
  description := "NCI Globus demo dataset",

  NciPrefix := "/g/data/eh28/globus/demo/share/",
  NciBamSuffix := ".bam",
  NciBamIndexSuffix := ".bam.bai",

  cases := (
    FOR item in json_array_unpack(raw_data) UNION (
      INSERT dataset::DatasetCase {
        externalIdentifiers := [ (system:="", value:=<str>item['sample_id'])],
        patients := (
          INSERT dataset::DatasetPatient {
            externalIdentifiers := [ (system:="", value := <str>item['sample_id']) ],
            consent := (INSERT consent::Consent {
              statements := {
                (INSERT consent::ConsentStatementDuo {
                  dataUseLimitation := <json>item['duo_json']
                })
              }
            }),
            specimens := (
              INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="", value := <str>item['sample_id']) ],
                artifacts := {
                  (INSERT lab::ArtifactBam {
                    bamFile := (
                      INSERT storage::File {
                        url := NciPrefix ++ <str>item['sub_dir'] ++ "/" ++ <str>item['sample_id'] ++ NciBamSuffix,
                        size := <int64>item['bam_size'],
                        checksums := [ (type:="MD5", value := <str>item['md5_hash']) ]
                      }
                      UNLESS CONFLICT ON .url ELSE (SELECT storage::File)
                    ),
                    baiFile := (
                      INSERT storage::File {
                        url := NciPrefix ++ <str>item['sub_dir'] ++ "/" ++ <str>item['sample_id'] ++ NciBamIndexSuffix,
                        size := <int64>item['bai_size'],
                        checksums := [ (type:="MD5", value:="TODO") ]
                      }
                      UNLESS CONFLICT ON .url ELSE (SELECT storage::File)
                    )
                  })
                }
              }
            )
          }
        )
      }
    )
  )

INSERT dataset::Dataset {
  uri := uri,
  externalIdentifiers := externalIdentifiers,
  description := description,
  cases := cases
}
UNLESS CONFLICT on .uri
ELSE (
  UPDATE dataset::Dataset SET {
    externalIdentifiers := externalIdentifiers,
    description := description,
    cases := cases
  }
);

