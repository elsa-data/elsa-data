module lab {

    type File {
        required property url -> str;
        required property size -> int64;
        required property checksums -> array<tuple<type: ChecksumType, value: str>>;
    }

    scalar type ChecksumType extending enum<'MD5', 'AWS_ETAG', 'SHA_1', 'SHA_256'>;

    abstract type ArtifactBase  {
    }

    type ArtifactBcl extending ArtifactBase {
        required link bclFile -> File;
    }

    type ArtifactFastqPair extending ArtifactBase {
        required link forwardFile -> File;
        required link reverseFile -> File;
    }

    type ArtifactVcf extending ArtifactBase {
        required link vcfFile -> File;
        required link tbiFile -> File;
    }

    type ArtifactBam extending ArtifactBase {
        required link bamFile -> File;
        required link baiFile -> File;
    }

    type ArtifactCram extending ArtifactBase {
        required link cramFile -> File;
        required link craiFile -> File;
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

        multi link artifactsProduced -> ArtifactBase {
            constraint exclusive;
            on target delete allow;
       };
    }

    type Analyses {
        property pipeline -> str;
        property analysesDate -> datetime;

        multi link input -> ArtifactBase;

        multi link output -> ArtifactBase {
              constraint exclusive;
              on target delete allow;
        };
    }


}
