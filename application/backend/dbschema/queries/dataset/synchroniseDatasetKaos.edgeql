# synchronises the KAOS dataset

WITH
  doi := <str>$datasetDoi,
  uri := <str>$datasetUri,
  externalIdentifiers := [ (system:="DOI",value:=doi) ],
  description := "KAOS - a dataset for evil",

  s3Prefix := "s3://umccr-googlebrain-data-dev/",
  s3Vcf1Suffix := ".novaseq.wes_idt.50x.deepvariant-v1.0.grch38.vcf.gz",
  s3Vcf1IndexSuffix := ".novaseq.wes_idt.50x.deepvariant-v1.0.grch38.vcf.gz.tbi",
  s3Vcf2Suffix := ".novaseq.wes_idt.50x.gatk4.grch38.vcf.gz",
  s3Vcf2IndexSuffix := ".novaseq.wes_idt.50x.gatk4.grch38.vcf.gz.tbi",
  s3BamSuffix := ".novaseq.wes_idt.50x.dedup.bam",
  s3BamIndexSuffix := ".novaseq.wes_idt.50x.dedup.bam.bai",
  s3Fastq1Suffix := ".novaseq.wes_idt.50x.R1.fastq.gz",
  s3Fastq2Suffix := ".novaseq.wes_idt.50x.R2.fastq.gz",

  # HG006
  #

  aArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG006" ++ s3Fastq1Suffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="E/L8/vhy0CY=")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          reverseFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG006" ++ s3Fastq2Suffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="sfCQTkrbzYs=")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG006" ++ s3BamSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG006" ++ s3BamIndexSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG006" ++ s3Vcf1Suffix,
              size := 0,
              checksums := [
               (type:="MD5",value:="TODO"),
               (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG006" ++ s3Vcf1IndexSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  # HG007
  #

  bArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG007" ++ s3Fastq1Suffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          reverseFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG007" ++ s3Fastq2Suffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG007" ++ s3BamSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG007" ++ s3BamIndexSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="69752816d99f403e20c2a2afb9df71a1"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG007" ++ s3Vcf1Suffix,
              size := 0,
              checksums := [
               (type:="MD5",value:="TODO"),
               (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG007" ++ s3Vcf1IndexSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  # NA12891
  #

  cArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12891" ++ s3Fastq1Suffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          reverseFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12891" ++ s3Fastq2Suffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12891" ++ s3BamSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12891" ++ s3BamIndexSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12891" ++ s3Vcf1Suffix,
              size := 0,
              checksums := [
               (type:="MD5",value:="TODO"),
               (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12891" ++ s3Vcf1IndexSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  # NA12892
  #

  dArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12892" ++ s3Fastq1Suffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          reverseFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12892" ++ s3Fastq2Suffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
    (INSERT lab::ArtifactBam {
          bamFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12892" ++ s3BamSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12892" ++ s3BamIndexSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          )
        }
      ),
      (INSERT lab::ArtifactVcf {
          vcfFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12892" ++ s3Vcf1Suffix,
              size := 0,
              checksums := [
               (type:="MD5",value:="TODO"),
               (type:="AWS_CRC64NVME",value:="TODO")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "NA12892" ++ s3Vcf1IndexSuffix,
              size := 0,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  run := {
    (INSERT lab::Run {
      platform := "Illumina Novaseq",
      runDate := <datetime>'2018-05-07T15:01:22+00',
      artifactsProduced := {
        aArtifacts,
        bArtifacts,
        cArtifacts,
        dArtifacts,
      }
    })
  },

  cases := {
    (INSERT dataset::DatasetCase {
      externalIdentifiers := [ (system:="",value:="FAMILY-AB") ],
      # we have static consents at this family level allowing only
      # disease specific research
      consent := (INSERT consent::Consent {
        statements := {
          (INSERT consent::ConsentStatementDuo {
            # SNOMED hereditary auditory
            dataUseLimitation := <json>(code := "DUO:0000007", diseaseSystem := "http://snomed.info/sct", diseaseCode := "362991006")
          }),
          (INSERT consent::ConsentStatementDuo {
            # SNOMED hereditary visual
            dataUseLimitation := <json>(code := "DUO:0000007", diseaseSystem := "http://snomed.info/sct", diseaseCode := "363343008")
          })
        }
      }),
      patients := {
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "male",
          externalIdentifiers := [ (system:="",value:="A") ],
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG006") ],
                artifacts := aArtifacts
            }
          )
        }),
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "female",
          externalIdentifiers := [ (system:="",value:="B") ],
          specimens := (
            INSERT dataset::DatasetSpecimen {
              externalIdentifiers := [ (system:="",value:="HG007") ],
              # but B has a specific specimen level consent with no restrictions that will overrule all
              consent := (INSERT consent::Consent {
                statements := {
                  (INSERT consent::ConsentStatementDuo {
                    # no restrictions
                    dataUseLimitation := <json>(code := "DUO:0000004")
                  })
                }
              }),
              artifacts := bArtifacts
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
          externalIdentifiers := [ (system:="",value:="X") ],
          # we have static consent at this patient allowing disease specific research
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDuo {
                # SNOMED hereditary endocrine
                dataUseLimitation := <json>(code := "DUO:0000007", diseaseSystem := "http://snomed.info/sct", diseaseCode := "363104002")
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="NA12891") ],
                artifacts := cArtifacts
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
          externalIdentifiers := [ (system:="",value:="Y") ],
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="NA12892") ],
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
