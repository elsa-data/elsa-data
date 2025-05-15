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
      any(
        (not .bclFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      any(.<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri)
  ),

  fastqArtifact := (
    select lab::ArtifactFastqPair
    filter 
      any(
        (not .forwardFile.isDeleted) or <bool>$includeDeletedFile
          and
        (not .reverseFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      any(.<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri)
  ),

  vcfArtifact := (
    select lab::ArtifactVcf
    filter 
      any(
        (not .vcfFile.isDeleted) or <bool>$includeDeletedFile
          and
        (not .tbiFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      any(.<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri)
  ),

  bamArtifact := (
    select lab::ArtifactBam
    filter 
      any(
        (not .bamFile.isDeleted) or <bool>$includeDeletedFile
          and
        (not .baiFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      any(.<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri)
  ),

  cramArtifact := (
    select lab::ArtifactCram
    filter 
      any(
        (not .cramFile.isDeleted) or <bool>$includeDeletedFile
          and
        (not .craiFile.isDeleted) or <bool>$includeDeletedFile
      )
        and
      any(.<artifacts[is dataset::DatasetSpecimen]
      .dataset
      .uri = <str>$datasetUri)
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

select assert_single((
  select {
    bclCount := bclCount,
    fastqCount := fastqCount,
    vcfCount := vcfCount,
    bamCount := bamCount,
    cramCount := cramCount,

    totalArtifactCount := totalArtifactCount,
    totalArtifactSizeBytes := totalArtifactSize,
  }
  filter
    isAllowedQuery
))
