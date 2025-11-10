# synchronises the CONTROL dataset

WITH
  doi := <str>$datasetDoi,
  uri := <str>$datasetUri,
  externalIdentifiers := [ (system:="DOI",value:=doi) ],
  description := "CONTROL - a dataset for good",

  s3Prefix := "s3://umccr-googlebrain-data-dev/",
  s3Vcf1Suffix := ".novaseq.wes_idt.50x.deepvariant-v1.0.grch38.vcf.gz",
  s3Vcf1IndexSuffix := ".novaseq.wes_idt.50x.deepvariant-v1.0.grch38.vcf.gz.tbi",
  s3Vcf2Suffix := ".novaseq.wes_idt.50x.gatk4.grch38.vcf.gz",
  s3Vcf2IndexSuffix := ".novaseq.wes_idt.50x.gatk4.grch38.vcf.gz.tbi",
  s3BamSuffix := ".novaseq.wes_idt.50x.dedup.bam",
  s3BamIndexSuffix := ".novaseq.wes_idt.50x.dedup.bam.bai",
  s3Fastq1Suffix := ".novaseq.wes_idt.50x.R1.fastq.gz",
  s3Fastq2Suffix := ".novaseq.wes_idt.50x.R2.fastq.gz",

  # HG001
  #

  aArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG001" ++ s3Fastq1Suffix,
              size := 1315993355,
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
              url := s3Prefix ++ "HG001" ++ s3Fastq2Suffix,
              size := 1357487918,
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
              url := s3Prefix ++ "HG001" ++ s3BamSuffix,
              size := 1958442954,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="b7fotvbCLTA=")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG001" ++ s3BamIndexSuffix,
              size := 5669720,
              checksums := [
                (type:="MD5",value:="ad460f6e96063de6b9872dd45322a797"),
                (type:="AWS_CRC64NVME",value:="6O01aEaEho0=")
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
              url := s3Prefix ++ "HG001" ++ s3Vcf1Suffix,
              size := 3260778,
              checksums := [
               (type:="MD5",value:="28b2cf3440478037b4b12635905107f6"),
               (type:="AWS_CRC64NVME",value:="skwxtUXtfqA=")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG001" ++ s3Vcf1IndexSuffix,
              size := 340520,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="bN8WTdLFmDs=")
              ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  # HG002
  #

  bArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG002" ++ s3Fastq1Suffix,
              size := 1328892315,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="hkV5jjVQ/pA=")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          reverseFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG002" ++ s3Fastq2Suffix,
              size := 1369931769,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="2yEhjoOCjMk=")
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
              url := s3Prefix ++ "HG002" ++ s3BamSuffix,
              size := 1949391484,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="qhbFrGJVMOs=")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          baiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG001" ++ s3BamIndexSuffix,
              size := 5516304,
              checksums := [
                (type:="MD5",value:="69752816d99f403e20c2a2afb9df71a1"),
                (type:="AWS_CRC64NVME",value:="QAdQGWFt3jM=")
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
              url := s3Prefix ++ "HG002" ++ s3Vcf1Suffix,
              size := 3251432,
              checksums := [
               (type:="MD5",value:="88bc6ee8de4a1ce0d231396187bc8bf4"),
               (type:="AWS_CRC64NVME",value:="CJWLwhPOFcU=")
              ]
            }
            UNLESS CONFLICT ON .url
            ELSE (SELECT storage::File)
          ),
          tbiFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG002" ++ s3Vcf1IndexSuffix,
              size := 342379,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  # HG003
  #

  cArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG003" ++ s3Fastq1Suffix,
              size := 1313835666,
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
              url := s3Prefix ++ "HG003" ++ s3Fastq2Suffix,
              size := 1349183119,
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
              url := s3Prefix ++ "HG003" ++ s3BamSuffix,
              size := 1940463353,
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
              url := s3Prefix ++ "HG003" ++ s3BamIndexSuffix,
              size := 5687792,
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
              url := s3Prefix ++ "HG003" ++ s3Vcf1Suffix,
              size := 3276917,
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
              url := s3Prefix ++ "HG003" ++ s3Vcf1IndexSuffix,
              size := 343484,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  # HG004
  #

  dArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG004" ++ s3Fastq1Suffix,
              size := 1298453059,
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
              url := s3Prefix ++ "HG004" ++ s3Fastq2Suffix,
              size := 1331439042,
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
              url := s3Prefix ++ "HG004" ++ s3BamSuffix,
              size := 1916923687,
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
              url := s3Prefix ++ "HG004" ++ s3BamIndexSuffix,
              size := 5607720,
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
              url := s3Prefix ++ "HG004" ++ s3Vcf1Suffix,
              size := 3306404,
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
              url := s3Prefix ++ "HG004" ++ s3Vcf1IndexSuffix,
              size := 344393,
              checksums := [
                (type:="MD5",value:="TODO"),
                (type:="AWS_CRC64NVME",value:="TODO")
              ]
            } unless conflict on .url else (select storage::File)
          )
        }
      )
  },

  # HG005
  #

  eArtifacts := {
    (INSERT lab::ArtifactFastqPair {
          forwardFile := (
            INSERT storage::File {
              url := s3Prefix ++ "HG005" ++ s3Fastq1Suffix,
              size := 1292793084,
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
              url := s3Prefix ++ "HG005" ++ s3Fastq2Suffix,
              size := 1333389412,
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
              url := s3Prefix ++ "HG005" ++ s3BamSuffix,
              size := 1891267048,
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
              url := s3Prefix ++ "HG005" ++ s3BamIndexSuffix,
              size := 5470560,
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
              url := s3Prefix ++ "HG005" ++ s3Vcf1Suffix,
              size := 3237104,
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
              url := s3Prefix ++ "HG005" ++ s3Vcf1IndexSuffix,
              size := 342433,
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
      externalIdentifiers := [ (system:="",value:="FAMILY-SMART") ],
      patients := {
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "male",
          externalIdentifiers := [ (system:="",value:="AGENT-86") ],
          # patient 86 is hooked into the dynamic consent system
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-XAY-00000"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG001") ],
                artifacts := aArtifacts
            }
          )
        }),
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "female",
          externalIdentifiers := [ (system:="",value:="AGENT-99") ],
          # patient 99 is hooked into the dynamic consent system
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-XAY-00001"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
              externalIdentifiers := [ (system:="",value:="HG002") ],
              artifacts := bArtifacts
            }
          )
        }),
        (INSERT dataset::DatasetPatient {
          sexAtBirth := "male",
          externalIdentifiers := [ (system:="",value:="AGENT-K13") ],
          # patient 13 is hooked into the dynamic consent system
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-XAY-00002"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG003") ],
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
          externalIdentifiers := [ (system:="",value:="AGENT-44") ],
          # patient 44 is hooked into the dynamic consent system
          consent := (INSERT consent::Consent {
            statements := {
              (INSERT consent::ConsentStatementDynamicDuo {
                consentSystemIdentifier := "PID-XAY-00003"
              })
            }
          }),
          specimens := (
            INSERT dataset::DatasetSpecimen {
                externalIdentifiers := [ (system:="",value:="HG004") ],
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
              externalIdentifiers := [ (system:="",value:="AGENT-66") ],
              # patient 66 is hooked into the dynamic consent system
              consent := (INSERT consent::Consent {
                statements := {
                  (INSERT consent::ConsentStatementDynamicDuo {
                    consentSystemIdentifier := "PID-XAY-00004"
                  })
                }
              }),
              specimens := (
                INSERT dataset::DatasetSpecimen {
                    externalIdentifiers := [ (system:="",value:="HG005") ],
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
