module permission {

    type User {

        required property subjectId -> str {
            # all user subjectIds must be unique
            constraint exclusive;
            constraint min_len_value(6);
            readonly := true;
        }

        required property displayName -> str;

        required property lastLoginDateTime -> datetime {
            default := datetime_current();
        }

        # these are the set of administrator level permissions that can be given
        # to a user

        required property allowedCreateRelease -> bool {
            default := false;
        };
        required property allowedImportDataset -> bool {
           default := false;
        };
        required property allowedChangeReleaseDataOwner -> bool {
            default := false;
        };

        # whether this user is a participant in a release

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
