
module dataset {

    function extractIdentifierValue(i: tuple<system: str, value: str>) -> str
    using (i.value);

    # a abstract type that represents any part of the dataset that we might link
    # to to make statements about it being 'shared'

    abstract type DatasetShareable {

        # if present - represents consent rules that apply to this shareable entity
        # consent statements in parent items in the dataset tree also always apply if present

        link consent -> consent::Consent{
            on target delete allow;
            on source delete delete target;
        };
    }

    # a abstract type that represents a location to store identifiers for
    # each part of a dataset

    abstract type DatasetIdentifiable {
        property externalIdentifiers -> array<tuple<system: str, value: str>>;
    }


    # the main data type that represents a collection of genomic data
    # collected from an organisation/study

    type Dataset extending DatasetShareable, DatasetIdentifiable {

        required property uri -> str {
            readonly := true;
            constraint exclusive on (str_lower(__subject__));
        }

        required property description -> str;

        optional link previous -> Dataset;

        multi link cases -> DatasetCase {
            on source delete delete target;
            on target delete allow;
            constraint exclusive;
        };

        required property isInConfig -> bool {
            default := true;
        };

        property updatedDateTime -> datetime;
    }


    # the case wraps up all items that are part of a single unit/record of study
    # this will often be a 'no-op' wrapper - without its own identifiers
    # but for instance, for a family case this might have the family identifiers

    type DatasetCase extending DatasetShareable, DatasetIdentifiable {

        # the backlink to the dataset that owns us
        link dataset := .<cases[is Dataset];

        multi link patients -> DatasetPatient {
            on source delete delete target;
            on target delete allow;
            constraint exclusive;
        }

        # pedigree data structure
        optional link pedigree -> pedigree::Pedigree{
            on source delete delete target;
            on target delete allow;
            constraint exclusive;
        };

        # sample info (which are normals etc)
    }

    scalar type SexAtBirthType extending enum<'male', 'female', 'other'>;

    # the patient represents a single human who may have attached specimens

    type DatasetPatient  extending DatasetShareable, DatasetIdentifiable {

        optional property sexAtBirth -> SexAtBirthType;

        # the backlink to the dataset that owns us
        link dataset := .<patients[is DatasetCase].<cases[is Dataset];

        multi link specimens -> DatasetSpecimen {
            on source delete delete target;
            on target delete allow;
        }
    }

    # the specimen represents the source biological material inputted to the
    # sequencing performed on an individual

    type DatasetSpecimen extending DatasetShareable, DatasetIdentifiable {

        optional property sampleType -> str;

        # the backlink to the dataset that owns us
        link dataset := .<specimens[is DatasetPatient].<patients[is DatasetCase].<cases[is Dataset];

        # the backlink to the case that owns us
        link case_ := .<specimens[is DatasetPatient].<patients[is DatasetCase];

        # the backlink to the patient that owns us
        link patient := .<specimens[is DatasetPatient];

        # the specimen links to all actual genomic artifacts (files) that have been
        # created in any lab process
        multi link artifacts -> lab::ArtifactBase;
    }
}
