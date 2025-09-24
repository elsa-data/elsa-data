# synchronises the KAOS dataset

WITH
  doi := <str>$datasetDoi,
  uri := <str>$datasetUri,
  externalIdentifiers := [ (system:="DOI",value:=doi) ],
  description := "KAOS - a dataset for getting smart",

  aArtifacts := {
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := "s3://blah/foo.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="424ca9d51649b47dc935fc63552036ee") ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/foo.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="424ca9d51649b47dc935fc63552036ee") ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/foo.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/foo.vcf.gz.tbi",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  bArtifacts := {
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := "s3://blah/foob.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/foob.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/foob.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/foob.vcf.gz.tbi",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  cArtifacts := {
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := "s3://blah/fooc.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/fooc.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/fooc.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/fooc.vcf.gz.tbi",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  dArtifacts := {
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := "s3://blah/food.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/food.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/food.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/food.vcf.gz.tbi",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  eArtifacts := {
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := "s3://blah/fooe.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/fooe.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/fooe.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/fooe.vcf.gz.tbi",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },


  run := {
    (INSERT lab::Run {
      platform := "Illumina Whizz Bang",
      runDate := <datetime>'2018-05-07T15:01:22+00',
      artifactsProduced := {
        aArtifacts,
        bArtifacts,
        cArtifacts,
        dArtifacts,
        eArtifacts,
      }
    })
  },

  cases := {
    (INSERT dataset::DatasetCase {
      externalIdentifiers := [ (system:="",value:="FAMILY-ABC") ],
      # we have a static consent at the family level allowing
      consent := (INSERT consent::Consent {
        statements := {
          (INSERT consent::ConsentStatementDuo {
            dataUseLimitation := <json>(name := "named tuple", count := 2)
          })
        }
      }),
      patients := {
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "male",
          externalIdentifiers := [ (system:="",value:="A") ],
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-TYT-00000"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG00096") ],
                artifacts := aArtifacts
            }
          )
        }),
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "female",
          externalIdentifiers := [ (system:="",value:="B") ],
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG00097") ],
                artifacts := bArtifacts
            }
          )
        }),
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "male",
          externalIdentifiers := [ (system:="",value:="C") ],
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG00099") ],
                artifacts := cArtifacts
            }
          )
        })
      }
    }),
    (INSERT dataset::DatasetCase {
      externalIdentifiers := [ (system:="",value:="") ],
      patients := {
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "female",
          externalIdentifiers := [ (system:="",value:="D") ],
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG00011") ],
                artifacts := dArtifacts
            }
          )
        }),
      }
    }),
    (INSERT dataset::DatasetCase {
      externalIdentifiers := [ (system:="",value:="") ],
      patients := {
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "female",
          externalIdentifiers := [ (system:="",value:="E") ],
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG00012") ],
                artifacts := eArtifacts
            }
          )
        }),
      }
    })
  }

INSERT dataset::Dataset {
  uri := uri,
  externalIdentifiers := externalIdentifiers,
  description := description,
  cases := cases
}
UNLESS CONFLICT ON .uri
ELSE (
  UPDATE dataset::Dataset SET {
    externalIdentifiers := externalIdentifiers,
    description := description,
    cases := cases
  }
)
