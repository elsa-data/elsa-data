# A dataset summary query via edgeql

with

  allDataset := (select dataset::Dataset)

select {
  results := assert_distinct((
    select (
      for d in allDataset
      union (
        with

          # Query all artifacts

          bclArtifact := (
            select lab::ArtifactBcl 
            filter 
              (
                (not .bclFile.isDeleted) or <bool>$includeDeletedFile
              )
                and
              .<artifacts[is dataset::DatasetSpecimen]
              .dataset
              .uri = d.uri
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
              .uri = d.uri
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
              .uri = d.uri
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
              .uri = d.uri
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
              .uri = d.uri
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
            count(bclArtifact.bclFile.size),
            count(fastqArtifact.forwardFile.size),
            count(fastqArtifact.reverseFile.size),
            count(vcfArtifact.vcfFile.size),
            count(vcfArtifact.tbiFile.size),
            count(bamArtifact.bamFile.size),
            count(bamArtifact.baiFile.size),
            count(cramArtifact.cramFile.size),
            count(cramArtifact.craiFile.size),
          }),

          # List all type of artifacts
          artifactList := "",
          artifactList:= (select artifactList ++ "BCL " if bclCount > 0 else  artifactList ++ "" ),
          artifactList:= (select artifactList ++ "FASTQ " if fastqCount > 0 else  artifactList ++ "" ),
          artifactList:= (select artifactList ++ "VCF " if vcfCount > 0 else  artifactList ++ "" ),
          artifactList:= (select artifactList ++ "BAM " if bamCount > 0 else  artifactList ++ "" ),
          artifactList:= (select artifactList ++ "CRAM " if cramCount > 0 else  artifactList ++ "" ),
          

        select {
          uri := d.uri,
          description := d.description,
          updatedDateTime := d.updatedDateTime,
          isInConfig := d.isInConfig,

          summaryCaseCount := count(d.cases),
          summaryPatientCount := count(d.cases.patients),
          summarySpecimenCount := count(d.cases.patients.specimens),

          bclCount := bclCount,
          fastqCount := fastqCount,
          vcfCount := vcfCount,
          bamCount := bamCount,
          cramCount := cramCount,

          artifactTypesSummary := artifactList,
          
          summaryArtifactCount := totalArtifactCount,
          summaryArtifactSizeBytes := totalArtifactSize,
        }
      )
    )
    order by
        .isInConfig desc then 
        .updatedDateTime desc
    offset
        <int16>$offset
    limit
        <int16>$limit
  )),
  totalCount := count(allDataset)
}
