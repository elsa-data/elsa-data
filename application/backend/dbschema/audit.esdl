module audit {

    type AuditEvent {
        # when the event occurred - including optional duration if
        # modelling an event that occurred over a significant period of time

        # occurredDateTime always records the 'beginning' of the activity

        # for example copying a large file may take 10 minutes - if started 9am on Friday then
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
