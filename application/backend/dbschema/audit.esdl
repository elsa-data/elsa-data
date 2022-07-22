module audit {

    scalar type ActionType extending enum<'C', 'R', 'U', 'D', 'E'>;

    type AuditEvent {
        # a code for the broad category of action

        required property action -> ActionType;

        # when this audit record has been made (should be close to occurredDateTime!)

        required property recordedDateTime -> datetime {
            default := datetime_current();
            readonly := true;
        }

        # when the event occurred - including optional duration if
        # modelling an event that occurred over a significant period of time
        # occurredDateTime always records the 'beginning' of the activity
        # for example copying a large file may take 10 minutes - if started 9am on Friday then
        # -> occurredDateTime = Friday 9am, occurredDuration = 10 mins

        required property occurredDateTime -> datetime;
        property occurredDuration -> duration;

        # Code	Display	Definition
        #    0	Success	The operation completed successfully (whether with warnings or not).
        #    4	Minor failure	The action was not successful due to some kind of minor failure (often equivalent to an HTTP 400 response).
        #    8	Serious failure	The action was not successful due to some kind of unexpected error (often equivalent to an HTTP 500 response).
        #    12	Major failure	An error of such magnitude occurred that the system is no longer available for use (i.e. the system died).

        required property outcome extending int16 {
            constraint one_of (0, 4, 8, 12);
        }


        property what -> str;
    }
}
