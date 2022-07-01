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

        multi link selectedSpecimens -> dataset::DatasetSpecimen {
            on target delete allow;
        }

        optional link runningJob -> job::Job {
            on target delete allow;
            constraint exclusive;
        }

        # the set of copied dataset information

        #multi link sharedContent -> ReleaseDataset {
        #    on target delete allow;
        #    constraint exclusive;
        #};

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

    abstract type ReleaseShareable {

        # if present - represents consent rules that apply to this shareable entity
        # consent statements in parent items in the dataset tree also always apply if present

        link consent -> consent::Consent;
    }

    # a abstract type that represents a location to store identifiers for
    # each part of a dataset

  ##  abstract type ReleaseIdentifiable {
  #      property externalIdentifiers -> array<tuple<system: str, value: str>>;
  #  }

    # the main data type that represents a collection of genomic data
    # collected from an organisation/study

 #   type ReleaseDataset extending ReleaseShareable, ReleaseIdentifiable {
#
 #       # along with any external identifiers - we require that datasets have an immutable URI
  #      # that uniquely identifies them globally
#        required property uri -> str {
#          readonly := true;
#        }
#
#        required property description -> str;
#
#        multi link cases -> ReleaseCase {
#            on target delete allow;
#            constraint exclusive;
#        };
#    }

#    type ReleaseCase extending ReleaseShareable, ReleaseIdentifiable {
#
#        # the backlink to the dataset that owns us
#        link dataset := .<cases[is ReleaseDataset];
#
#        multi link patients -> ReleasePatient {
#            on target delete allow;
 #           constraint exclusive;
#        }
#
 #       # pedigree data structure
#
#        # sample info (which are normals etc)
#    }


    # the patient represents a single human who may have attached specimens

#    type ReleasePatient  extending ReleaseShareable, ReleaseIdentifiable {

        # the backlink to the dataset that owns us
 #       link dataset := .<patients[is ReleaseCase].<cases[is ReleaseDataset];

 #       multi link specimens -> ReleaseSpecimen {
 #           on target delete allow;
 #           constraint exclusive;
 #       }
 #   }

    # the specimen represents the source biological material inputted to the
    # sequencing performed on an individual

 #   type ReleaseSpecimen extending ReleaseShareable, ReleaseIdentifiable {

  #      required property included -> bool;

        # the backlink to the dataset that owns us
#        link dataset := .<specimens[is ReleasePatient].<patients[is ReleaseCase].<cases[is ReleaseDataset];

        # the specimen links to all actual genomic artifacts (files) that have been
        # created in any lab process
 #       multi link artifacts -> lab::ArtifactBase;
  #  }

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
