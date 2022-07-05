module release {

    # a release is the main artifact that encapsulates a particular release of data from
    # given dataset(s) to given user(s) with given restrictions/conditions

    type Release {

        required property created -> datetime {
             default := datetime_current();
             readonly := true;
        };

        # the creation of a release will be triggered by an approved application in a DAC
        # this is all the details we can import from the source DAC

        property applicationDacIdentifier -> str;
        property applicationDacTitle -> str;
        property applicationDacDetails -> str;

        # once a release is started - it is possible for the data owner to encode some
        # details of the application to help with automation

        required link applicationCoded -> ApplicationCoded;

        property releaseIdentifier -> str;

        property releaseStarted -> datetime;
        property releaseEnded -> datetime;

        # 1..n datasets that we the sources of items in this release
        required property datasetUris -> array<str>;

        # all the specimens that are included in this release

        multi link selectedSpecimens -> dataset::DatasetSpecimen {
            on target delete allow;
        }

        # if present indicates that a running job is active in the context of this release

        optional link runningJob := (
            select .<forRelease[is job::Job] filter .status = job::JobStatus.running
        );

        # the set of resources explicitly chosen for exclusion no matter what an automated
        # algorithm says
        multi link manualExclusions -> dataset::DatasetShareable {
            property who -> str;
            property recorded -> str;
            property reason -> str;
        };
    }

    scalar type ApplicationCodedStudyType extending enum<'GRU', 'HMB', 'CC', 'POA', 'DS'>;

    type ApplicationCoded {

        required property studyType -> ApplicationCodedStudyType;

        required property diseasesOfStudy -> array<tuple<system: str, code: str>>;

        required property countriesInvolved -> array<tuple<system: str, code: str>>;

        required property institutesInvolved -> array<tuple<system: str, code: str>>;

        required property studyAgreesToPublish -> bool;

        required property studyIsNotCommercial -> bool;
    }

    type AuditEvent {
        # when the event occurred - including optional duration if
        # modelling an event that occurred over a significant period of time
        # in this case occurredDateTime always records the 'beginning' of the activity
        # for instance copying a large file may take 10 minutes, starting 9am on Friday
        # -> occurredDateTime = Friday 9am, occurredDuration = 10 mins

        required property occurredDateTime -> datetime;
        property occurredDuration -> duration;

        # when this audit record has been made (should be close to occurredDateTime!)
        required property recordedDateTime -> datetime {
            default := datetime_current();
            readonly := true;
        }

        property what -> str;
    }
}
