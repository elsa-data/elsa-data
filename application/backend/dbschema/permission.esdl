module permission {

    type User {

        required property subjectId -> str {
            readonly := true;
        }

        property displayName -> str;

        multi link datasetOwner -> dataset::Dataset;

        multi link releaseParticipant -> release::Release {
            property role -> str {
               constraint one_of('DataOwner', 'Member', 'PI');
            }
        }

    }

}
