module lab {

    abstract type ArtifactBase  {
    }

    type ArtifactBcl extending ArtifactBase {
        required link bclFile -> storage::File;
    }

    type ArtifactFastqPair extending ArtifactBase {
        required link forwardFile -> storage::File;
        required link reverseFile -> storage::File;
    }

    type ArtifactVcf extending ArtifactBase {
        required link vcfFile -> storage::File;
        required link tbiFile -> storage::File;
    }

    type ArtifactBam extending ArtifactBase {
        required link bamFile -> storage::File;
        required link baiFile -> storage::File;
    }

    type ArtifactCram extending ArtifactBase {
        required link cramFile -> storage::File;
        required link craiFile -> storage::File;
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
