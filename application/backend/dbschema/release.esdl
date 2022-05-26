module release {

    # a release is the main artifact that encapsulates a particular release of data from a
    # given dataset(s) to a given user(s) with given restrictions/conditions

    type Release {

        property foos -> array<str>;

        required property created -> datetime;

        property started -> datetime;
        property ended -> datetime;

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
        multi link manual_exclusions -> dataset::DatasetShareable {
            property who -> str;
            property recorded -> str;
            property reason -> str;
        };
    }

    type AuditEvent {
        property occurredDateTime -> datetime;

        #constraint expression on (
        #        __subject__.occurredDateTime is not null or __subject__.occurredDuration is not null
        #    );

        required property recorded -> datetime;

        property what -> str;
    }
}
