module job {

    scalar type JobStatus extending enum<'running', 'failed', 'completed'>;

    abstract type Job {
        required property status -> JobStatus;

        required property messages -> array<str>;
    }

    # the premise here is a job that can gradually work through each case in the to do
    # set and if matching move the result to the result set

    type SelectJob extending Job {

        multi link todoQueue -> dataset::DatasetCase {
            on target delete allow;
        };

        multi link selectedSpecimens -> dataset::DatasetSpecimen {
            on target delete allow;
        };


    }
}
