module dataset {

    # a abstract type that represents any part of the dataset that we might link
    # to to make statements about it being 'shared'

    abstract type DatasetShareable {

        # if present - represents consent rules that apply to this shareable entity
        # consent statements in parent items in the dataset tree also always apply if present

        link consent -> consent::Consent;
    }

    # a abstract type that represents a location to store identifiers for
    # each part of a dataset

    abstract type DatasetIdentifiable {
        property externalIdentifiers -> array<tuple<system: str, value: str>>;
    }


    # the main data type that represents a collection of genomic data
    # collected from an organisation/study

    type Dataset extending DatasetShareable, DatasetIdentifiable {

        # along with any external identifiers - we require that datasets have an immutable URI
        # that uniquely identifies them globally
        required property uri -> str {
          readonly := true;
        }

        required property description -> str;

        optional link previous -> Dataset;

        multi link cases -> DatasetCase {
            on target delete allow;
            constraint exclusive;
        };
    }


    # the case wraps up all items that are part of a single unit/record of study
    # this will often be a 'no-op' wrapper - without its own identifiers
    # but for instance, for a family case this might have the family identifiers

    type DatasetCase extending DatasetShareable, DatasetIdentifiable {

        # the backlink to the dataset that owns us
        link dataset := .<cases[is Dataset];

        multi link patients -> DatasetPatient {
            on target delete allow;
            constraint exclusive;
        }

        # pedigree data structure

        # sample info (which are normals etc)
    }


    # the patient represents a single human who may have attached specimens

    type DatasetPatient  extending DatasetShareable, DatasetIdentifiable {

        # the backlink to the dataset that owns us
        link dataset := .<patients[is DatasetCase].<cases[is Dataset];

        multi link specimens -> DatasetSpecimen {
            on target delete allow;
            constraint exclusive;
        }
    }

    # the specimen represents the source biological material inputted to the
    # sequencing performed on an individual

    type DatasetSpecimen extending DatasetShareable, DatasetIdentifiable {

        # the backlink to the dataset that owns us
        link dataset := .<specimens[is DatasetPatient].<patients[is DatasetCase].<cases[is Dataset];

        # the specimen links to all actual genomic artifacts (files) that have been
        # created in any lab process
        multi link artifacts -> lab::ArtifactBase;
    }
}
