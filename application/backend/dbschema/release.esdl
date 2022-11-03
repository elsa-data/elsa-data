module release {

    scalar type ReleaseCounterSequence extending sequence;

    # a release is the main artifact that encapsulates a particular release of data from
    # given dataset(s) to given user(s) with given restrictions/conditions
    #
    type Release {

        required property created -> datetime {
             default := datetime_current();
             readonly := true;
        };

        # imported DAC application identifier
        #
        required property applicationDacIdentifier -> tuple<system: str, value: str> {
            # it is not allowed to have multiple releases from the same DAC application
            #
            constraint exclusive;
        }

        # imported DAC application title
        #
        required property applicationDacTitle -> str;

        # imported DAC application markdown details
        #
        required property applicationDacDetails -> str;

        # once a release is started - it is possible for the data owner to encode some
        # details of the application to help with automation
        #
        required link applicationCoded -> ApplicationCoded;

        required property releaseIdentifier -> str {
            constraint exclusive;
        }

        # 1..n datasets that we the sources of items in this release
        #
        required property datasetUris -> array<str>;

        property releaseStarted -> datetime;
        property releaseEnded -> datetime;

        # all the specimens that are included in this release
        #
        multi link selectedSpecimens -> dataset::DatasetSpecimen {
            on target delete allow;
        }

        # if present indicates that a running job is active in the context of this release
        #
        optional link runningJob := (
            select .<forRelease[is job::Job] filter .status = job::JobStatus.running
        );

        # an ordered array (first is most preferred) of URI systems to include in UI etc
        #
        required property datasetCaseUrisOrderPreference -> array<str>;
        required property datasetIndividualUrisOrderPreference -> array<str>;
        required property datasetSpecimenUrisOrderPreference -> array<str>;

        # a auto generated random string that is used for encrypting download zips etc
        # can be re-generated at an admin level
        #
        required property releasePassword -> str;

        # the counter is used for any operations where the release would like a plausibly
        # unique non clashing simple integer number - for instance - everytime something is downloaded the generated
        # filename can use the counter in the name and then step the sequence.
        # it should not be used as any form of secret i.e. where guessing the next number could
        # give the attacker any advantage (as the sequence is shared across the entire instance)
        #
        required property counter -> ReleaseCounterSequence {
            constraint exclusive;
        }

        # we store audit logs per release where they are directly attributable to a release
        #
        multi link auditLog -> audit::ReleaseAuditEvent {
            # audit events should not be able to be deleted (singly)
            #
            on target delete restrict;

            # the audit events can be deleted if the release itself is
            #
            on source delete delete target
        }


    }

    scalar type ApplicationCodedStudyType extending enum<'GRU', 'HMB', 'CC', 'POA', 'DS'>;

    type ApplicationCoded {

        # a classification of the type of research being performed with this release
        #
        required property studyType -> ApplicationCodedStudyType;

        # an array of coded diseases
        #
        required property diseasesOfStudy -> array<tuple<system: str, code: str>>;

        # an array of coded countries
        #
        required property countriesInvolved -> array<tuple<system: str, code: str>>;

        required property studyAgreesToPublish -> bool;

        required property studyIsNotCommercial -> bool;

        # a JSON formatted query (in Beacon v2 format) that will be applied when
        # selecting cases
        # so I think our query needs to match with query in here https://github.com/ga4gh-beacon/beacon-v2/blob/main/framework/json/requests/examples-fullDocuments/beaconRequestBody-MAX-example.json
        # but then the thing of interest is genomicVariants with the request parameters
        # anyhow we probably should tighten this up with some typescript/json schema once we work out exactly what we are doing here
        # https://github.com/ga4gh-beacon/beacon-v2/blob/main/models/json/beacon-v2-default-model/genomicVariations/requestParameters.json
        #
        required property beaconQuery -> json;
    }

}
