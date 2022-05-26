module release {

    # a release is the main artifact that encapsulates a particular release of data from a
    # given dataset(s) to a given user(s) with given restrictions/conditions

    type Release {

        required property created -> datetime;

        property started -> datetime;
        property ended -> datetime;

        property applicationIdentifier -> str;
        property applicationCoded -> json;

        # 1..n datasets that are suitable for releasing in this release
        # (note: this is the master set of items - the actual released data may be a subset of this)

        required multi link datasets -> dataset::Dataset;

        # the set of resources chosen for actual release
        # this might be the result of running a matching algorithm, or it could be created
        # manually

        multi link selected -> dataset::DatasetShareable {

        };

        # the set of resources explicitly chosen for exclusion no matter what an automated
        # algorithm says
        multi link manualExclusions -> dataset::DatasetShareable {
            property who -> str;
            property recorded -> str;
            property reason -> str;
        };
    }

    type AuditEvent {
        # when the event occurred - including optional duration if
        # modelling an event that occurred over a significant period of time
        # in this case occurredDateTime always records the 'beginning' of the activity
        # for instance copying a large file may take 10 minutes, starting 9am on Friday
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
