module pedigree {

    # not complete: just copying/pasting some examples..
    scalar type KinType extending enum<'isRelativeOf', 'isBiologicalRelativeOf','isBiologicalParentOf',
      'isBiologicalFatherOf','isBiologicalMotherOf','isSpermDonorOf',
      'isBiologicalSiblingOf', 'isFullSiblingOf', 'isMultipleBirthSiblingOf',
       'isParentalSiblingOf', 'isHalfSiblingOf', 'isMaternalCousinOf',
        'isPaternalCousinOf'>;

    type Pedigree {

        # the backlink to the datasetCase that owns it
        link case_ := .<pedigree[is dataset::DatasetCase];

        link proband -> dataset::DatasetPatient;

        multi link relationships -> PedigreeRelationship {
            on target delete allow;
            constraint exclusive;
        };

        optional property reason -> tuple<system: str, value: str>;
    }

    type PedigreeRelationship {
        required link individual -> dataset::DatasetPatient;

        # the relationship the individual has to the relative
        # (e.g., if the individual is the relative's biological mother,
        # then relation could be isBiologicalMother [KIN:027]);
        # terms should come from the KIN terminology
        required property relation -> KinType;

        required link relative -> dataset::DatasetPatient;

    }
}
