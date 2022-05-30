module lab {

    scalar type ChecksumType extending enum<'MD5', 'AWS-ETAG', 'SHA-1', 'SHA-256'>;

    abstract type ArtifactBase {
        required property url -> str;
        required property size -> int64;

        property checksums -> array<tuple<type: ChecksumType, value: str>>;
    }

    abstract type RunArtifactBase extending ArtifactBase {
    }

    type RunArtifactBcl extending RunArtifactBase {
    }

    type RunArtifactFastqPair extending RunArtifactBase {
        property urlR2 -> str;
    }

    abstract type AnalysesArtifactBase extending ArtifactBase {
    }

    type AnalysesArtifactVcf extending AnalysesArtifactBase {
        property urlTbi -> str;
    }

    type AnalysesArtifactBam extending AnalysesArtifactBase {
        property urlBai -> str;
    }



    # a collection of artifacts uploaded/submitted in a batch that has no information about run/analyses
    type SubmissionBatch {

        # some string property of this batch that is unique/meaningful to the provider of the data
        property externalIdentifier -> str;

        multi link artifactsIncluded -> ArtifactBase {
            constraint exclusive;
            on target delete allow;
       };

    }


    # a genomic sequencing run that outputs artifacts
    type Run {
        property platform -> str;
        property runDate -> datetime;

        multi link artifactsProduced -> RunArtifactBase {
            constraint exclusive;
            on target delete allow;
       };
    }

    type Analyses {
        property pipeline -> str;
        property analysesDate -> datetime;

        multi link input -> RunArtifactBase;

        multi link output -> AnalysesArtifactBase {
              constraint exclusive;
              on target delete allow;
        };
    }


}
