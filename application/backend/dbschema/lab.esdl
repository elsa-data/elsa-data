module lab {

    abstract type ArtifactBase  {
        property sampleIds -> array<str>;
    }

    type ArtifactBcl extending ArtifactBase {
        required link bclFile -> storage::File{
            on source delete delete target;
        };
    }

    type ArtifactFastqPair extending ArtifactBase {
        required link forwardFile -> storage::File{
            on source delete delete target;
        };
        required link reverseFile -> storage::File{
            on source delete delete target;
        };
    }

    type ArtifactVcf extending ArtifactBase {
        required link vcfFile -> storage::File{
            on source delete delete target;
        };
        required link tbiFile -> storage::File{
            on source delete delete target;
        };
    }

    type ArtifactBam extending ArtifactBase {
        required link bamFile -> storage::File{
            on source delete delete target;
        };
        required link baiFile -> storage::File{
            on source delete delete target;
        };
    }

    type ArtifactCram extending ArtifactBase {
        required link cramFile -> storage::File{
            on source delete delete target;
        };
        required link craiFile -> storage::File{
            on source delete delete target;
        };
    }

    # a collection of artifacts uploaded/submitted in a batch that has no information about run/analyses
    type SubmissionBatch {

        # some string property of this batch that is unique/meaningful to the provider of the data
        property externalIdentifier -> str;

        multi link artifactsIncluded -> ArtifactBase {
            constraint exclusive;
            on source delete delete target;
            on target delete allow;
       };
    }


    # a genomic sequencing run that outputs artifacts
    type Run {
        property platform -> str;
        property runDate -> datetime;

        multi link artifactsProduced -> ArtifactBase {
            constraint exclusive;
            on source delete delete target;
            on target delete allow;
       };
    }

    type Analyses {
        property pipeline -> str;
        property analysesDate -> datetime;

        multi link input -> ArtifactBase;

        multi link output -> ArtifactBase {
              constraint exclusive;
              on source delete delete target;
              on target delete allow;
        };
    }


}
