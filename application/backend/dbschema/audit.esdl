module audit {
    # ActionType definition
    # Ref: https://www.hl7.org/fhir/valueset-audit-event-action.html
    scalar type ActionType extending enum<'C', 'R', 'U', 'D', 'E'>;

    abstract type AuditEvent {
        # who initiated the action being audited
        required property whoId -> str;
        required property whoDisplayName -> str;

        # a code for the broad category of action (read, create, update etc)
        required property actionCategory -> ActionType;

        # a string describing the action but with no details i.e. "Viewing a Release", "Creating a User"
        # any details will appear later in the details JSON
        # the use of consistent (non-detailed) strings here can help with UI grouping/filtering etc

        required property actionDescription -> str;

        # when this audit record has been made (should be close to occurredDateTime!)

        required property recordedDateTime -> datetime {
            default := datetime_current();
            readonly := true;
        }

        # when this audit record has been updated in any way (by merging, outcome completion etc)

        required property updatedDateTime -> datetime {
            default := datetime_current();
        }

        index on (.updatedDateTime);

        # when the event occurred - including optional duration if
        # modelling an event that occurred over a significant period of time
        # occurredDateTime always records the 'beginning' of the activity
        # for example copying a large file may take 10 minutes - if started 9am on Friday then
        # -> occurredDateTime = Friday 9am, occurredDuration = 10 mins

        required property occurredDateTime -> datetime;
        property occurredDuration -> duration;

        # Code	Display	Definition
        #    0	Success	The operation completed successfully (whether with warnings or not).
        #    4	Minor failure	The action was not successful due to some kind of minor failure (often equivalent to an HTTP 400 response) - this includes things like logins failing, missing auth etc.
        #    8	Serious failure	The action was not successful due to some kind of unexpected error (often equivalent to an HTTP 500 response).
        #    12	Major failure	An error of such magnitude occurred that the system is no longer available for use (i.e. the system died).

        required property outcome -> int16 {
            constraint one_of (0, 4, 8, 12);
        }

        # bespoke JSON with details of the event

        property details -> json;
    }

    type DataAccessAuditEvent extending AuditEvent {
        # Link back which audit owns this
        link release_ := .<dataAccessAuditLog[is release::Release];
        
        # Number of bytes transfer out from storage
        required property egressBytes -> int64;
    }

    type ReleaseAuditEvent extending AuditEvent {
        # Link back which release own this audit log
        link release_ := .<releaseAuditLog[is release::Release];
    }

    type UserAuditEvent extending AuditEvent {
        # Link back to the user which this event belongs to.
        link user_ := .<userAuditEvent[is permission::User];
    }

    type SystemAuditEvent extending AuditEvent {
    }
}
