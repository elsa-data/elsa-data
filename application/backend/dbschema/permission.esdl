module permission {

    type User {

        required property subjectId -> str {
            # all user subjectIds must be unique
            constraint exclusive;
            constraint min_len_value(6);
            readonly := true;
        }

        property displayName -> str;

        multi link datasetOwner -> dataset::Dataset {
            # allow datasets to be removed - all that happens for the user is they lose permissions to that dataset
            # (in general datasets won't be deleted anyway)
            on target delete allow;
        }

        multi link releaseParticipant -> release::Release {
            property role -> str {
               constraint one_of('DataOwner', 'Member', 'PI');
            }

            # allow releases to be removed - all that happens for the user is they lose involvement with that release
            # (in general releases won't be deleted anyway)
            #
            on target delete allow;
        }

    }
}
