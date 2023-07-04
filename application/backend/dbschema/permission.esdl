module permission {

    # we need to support user as abstract/potential users - that get mentioned in DAC applications etc
    # by email address - but who have not yet ever logged into Elsa Data and so have not become
    # concrete users

    type PotentialUser {

        # note that email is the only identifier we are likely to be able to source from
        # upstream DACs so this is key we use for potential users
        # acknowledging that emails aren't a good long term identifier - but is relatively
        # stable over short periods of time (months)
        #
        required property email -> str {
            constraint exclusive on (str_lower(__subject__));
            readonly := true;
        }

        # if we have display name information we should fill it in
        #
        property displayName -> str;

        # whether this user will become a participant of a release when they login

        multi link futureReleaseParticipant -> release::Release {
            property role -> str {
               constraint one_of('Administrator', 'Manager', 'Member');
            }

            # allow releases to be removed - all that happens for the user is they lose involvement with that release
            # (in general releases won't be deleted anyway)
            #
            on target delete allow;
        }
    }


    type User {

        required property subjectId -> str {
            # all user subjectIds must be unique
            constraint exclusive;
            constraint min_len_value(6);
            readonly := true;
        }

        required property email -> str {
            constraint exclusive on (str_lower(__subject__));
            readonly := true;
        }

        required property displayName -> str;

        required property lastLoginDateTime -> datetime {
            default := datetime_current();
        }

        # These are the set of administrator level permissions that can be given
        # to a user

        # Write Access
        required property isAllowedRefreshDatasetIndex -> bool {
           default := false;
        };

        required property isAllowedCreateRelease -> bool {
            default := false;
        };
        
        # Read Access
        required property isAllowedOverallAdministratorView -> bool {
            default := false;
        }

        # whether this user is a participant in a release

        multi link releaseParticipant -> release::Release {
            property role -> str {
               constraint one_of('Administrator', 'Manager', 'Member');
            }

            # allow releases to be removed - all that happens for the user is they lose involvement with that release
            # (in general releases won't be deleted anyway)
            #
            on target delete allow;
        }

        multi link userAuditEvent -> audit::UserAuditEvent {
            # audit events should not be able to be deleted (singly)
            on target delete restrict;
        }
    }
}
