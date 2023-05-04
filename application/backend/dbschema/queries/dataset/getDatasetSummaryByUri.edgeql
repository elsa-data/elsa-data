# A dataset summary query via edgeql.
# Create a dataset summary by URI

with

  userPermission := (
    select permission::User
    filter .id = <uuid>$userDbId
  ),

  isAllowedQuery := (
    userPermission.isAllowedRefreshDatasetIndex 
      or 
    userPermission.isAllowedOverallAdministratorView
  ),

  bclArtifact := (
    select lab::ArtifactBcl 
    filter 
      (
        (not .bclFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      .<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri
  ),

  fastqArtifact := (
    select lab::ArtifactFastqPair
    filter 
      (
        (not .forwardFile.isDeleted) or <bool>$includeDeletedFile
          and
        (not .reverseFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      .<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri
  ),

  vcfArtifact := (
    select lab::ArtifactVcf
    filter 
      (
        (not .vcfFile.isDeleted) or <bool>$includeDeletedFile
          and
        (not .tbiFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      .<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri
  ),

  bamArtifact := (
    select lab::ArtifactBam
    filter 
      (
        (not .bamFile.isDeleted) or <bool>$includeDeletedFile
          and
        (not .baiFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      .<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri
  ),

  cramArtifact := (
    select lab::ArtifactCram
    filter 
      (
        (not .cramFile.isDeleted) or <bool>$includeDeletedFile
          and
        (not .craiFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      .<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri
  ),


  bclCount := count(bclArtifact),
  fastqCount := count(fastqArtifact),
  vcfCount := count(vcfArtifact),
  bamCount := count(bamArtifact),
  cramCount := count(cramArtifact),

  totalArtifactCount := sum({
    bclCount,
    fastqCount,
    vcfCount,
    bamCount,
    cramCount,
  }),

  totalArtifactSize := sum({
    bclArtifact.bclFile.size,
    fastqArtifact.forwardFile.size,
    fastqArtifact.reverseFile.size,
    vcfArtifact.vcfFile.size,
    vcfArtifact.tbiFile.size,
    bamArtifact.bamFile.size,
    bamArtifact.baiFile.size,
    cramArtifact.cramFile.size,
    cramArtifact.craiFile.size,
  }),

  # List all type of artifacts
  artifactList := "",
  artifactList:= (select artifactList ++ "BCL " if bclCount > 0 else  artifactList ++ "" ),
  artifactList:= (select artifactList ++ "FASTQ " if fastqCount > 0 else  artifactList ++ "" ),
  artifactList:= (select artifactList ++ "VCF " if vcfCount > 0 else  artifactList ++ "" ),
  artifactList:= (select artifactList ++ "BAM " if bamCount > 0 else  artifactList ++ "" ),
  artifactList:= (select artifactList ++ "CRAM " if cramCount > 0 else  artifactList ++ "" ),

select assert_single((
  select dataset::Dataset {
    uri := .uri,
    description := .description,
    updatedDateTime := .updatedDateTime,
    isInConfig := .isInConfig,

    cases := (
      select .cases { 
        consent: { id },
        externalIdentifiers,
        patients: {
          sexAtBirth,
          consent : { id },
          externalIdentifiers,
        }
      }
    ),

    totalCaseCount := count(.cases),
    totalPatientCount := count(.cases.patients),
    totalSpecimenCount := count(.cases.patients.specimens),

    bclCount := bclCount,
    fastqCount := fastqCount,
    vcfCount := vcfCount,
    bamCount := bamCount,
    cramCount := cramCount,

    artifactTypes := artifactList,
    
    totalArtifactCount := totalArtifactCount,
    totalArtifactSizeBytes := totalArtifactSize,
  }
  filter
  .uri = <str>$datasetUri
))