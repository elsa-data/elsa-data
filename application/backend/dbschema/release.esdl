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

        # an ordered array (first is most preferred) of URI systems to include in UI etc

        required property datasetCaseUrisOrderPreference -> array<str>;
        required property datasetIndividualUrisOrderPreference -> array<str>;
        required property datasetSpecimenUrisOrderPreference -> array<str>;

        # a auto generated random string that is used for encrypting download zips etc
        # can be re-generated at an admin level

        required property releasePassword -> str;


        # the set of resources explicitly chosen for exclusion no matter what an automated
        # algorithm says
        # DETERMINE IF THIS IS ACTUALLY A FEATURE WE WANT
        #multi link manualExclusions -> dataset::DatasetShareable {
        #    property who -> str;
        #    property recorded -> str;
        #    property reason -> str;
        #};
    }

    scalar type ApplicationCodedStudyType extending enum<'GRU', 'HMB', 'CC', 'POA', 'DS'>;

    type ApplicationCoded {

        # a classification of the type of research being performed with this release

        required property studyType -> ApplicationCodedStudyType;

        required property diseasesOfStudy -> array<tuple<system: str, code: str>>;

        required property countriesInvolved -> array<tuple<system: str, code: str>>;

        # required property institutesInvolved -> array<tuple<system: str, code: str>>;

        required property studyAgreesToPublish -> bool;

        required property studyIsNotCommercial -> bool;
    }
}
