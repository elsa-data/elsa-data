# synchronises the CONTROL dataset

WITH
  doi := <str>$datasetDoi,
  uri := <str>$datasetUri,
  externalIdentifiers := [ (system:="DOI",value:=doi) ],
  description := "CONTROL - a dataset for good",

  aArtifacts := {
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := "s3://blah/foo11.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="424ca9d51649b47dc935fc63552036ee") ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/foo11.bam.bai",
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
              url := "s3://blah/foo11.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/foo11.vcf.gz.tbi",
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
              url := "s3://blah/foo12.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/foo13.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/foo13.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/foo13.vcf.gz.tbi",
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
              url := "s3://blah/foo14.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/foo14.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/foo14.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/foo14.vcf.gz.tbi",
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
              url := "s3://blah/foo15.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/foo15.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/foo15.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/foo15.vcf.gz.tbi",
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
              url := "s3://blah/foo16.bam",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := "s3://blah/foo16.bam.bai",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := "s3://blah/foo16.vcf.gz",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := "s3://blah/foo16.vcf.gz.tbi",
              size := 12324324,
              checksums := [ (type:="MD5",value:="123435456") ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },


  run := {
    (INSERT lab::Run {
      platform := "Illumina Machine",
      runDate := <datetime>'2019-08-11T15:01:22+00',
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
      externalIdentifiers := [ (system:="",value:="FAMILY-S") ],
      patients := {
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "male",
          externalIdentifiers := [ (system:="",value:="A86") ],
          # patient 86 is hooked into the dynamic consent system
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-TYT-00000"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="00000") ],
                artifacts := aArtifacts
            }
          )
        }),
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "female",
          externalIdentifiers := [ (system:="",value:="A99") ],
          # patient 99 is hooked into the dynamic consent system
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-TYT-00001"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
              externalIdentifiers := [ (system:="",value:="00001") ],
              artifacts := bArtifacts
            }
          )
        }),
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "male",
          externalIdentifiers := [ (system:="",value:="K13") ],
          # patient 13 is hooked into the dynamic consent system
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-TYT-00002"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="00002") ],
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
          sexAtBirth := "male",
          externalIdentifiers := [ (system:="",value:="A45") ],
          # patient 45 is hooked into the dynamic consent system
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-TYT-00003"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="00003") ],
                artifacts := dArtifacts
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
