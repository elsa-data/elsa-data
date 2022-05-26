module lab {

    scalar type ChecksumType extending enum<'MD5', 'AWS-ETAG', 'SHA-1', 'SHA-256'>;

    abstract type ArtifactBase {
        required property url -> str;

        property checksums -> array<tuple<type: ChecksumType, value: str>>;
        property size -> int64;
    }

    abstract type RunArtifactBase extending ArtifactBase {
    }

    type RunArtifactBcl extending RunArtifactBase {
    }

    type RunArtifactFastqPair extending RunArtifactBase {
        property url_r2 -> str;
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
        property run_date -> datetime;

        multi link artifacts_produced -> RunArtifactBase {
            constraint exclusive;
            on target delete allow;
       };
    }

    type Analyses {
        property pipeline -> str;
        property analyses_date -> datetime;

        multi link input -> RunArtifactBase;

        multi link output -> AnalysesArtifactBase {
              constraint exclusive;
              on target delete allow;
        };
    }

    abstract type AnalysesArtifactBase extending ArtifactBase {
    }

    type AnalysesArtifactVcf extending AnalysesArtifactBase {
        property url_tbi -> str;
    }

    type AnalysesArtifactBam extending AnalysesArtifactBase {
        property url_bai -> str;
    }

}
