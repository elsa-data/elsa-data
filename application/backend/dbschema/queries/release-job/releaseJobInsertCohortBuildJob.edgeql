
WITH
    # the release key
    paramReleaseKey := <str>$releaseKey,

    # we must already have inserted an audit entry to represent starting this job
    paramAlreadyInsertedAuditEntryId := <uuid>$alreadyInsertedAuditEntryId,

    #######

    # the release we are looking at
    release := assert_single((SELECT release::Release FILTER .releaseKey = paramReleaseKey)),

    # the audit entry corresponding to this job
    auditEntry := assert_single((SELECT audit::ReleaseAuditEvent FILTER .id = paramAlreadyInsertedAuditEntryId)),

    # the datasets of the release
    datasets := (SELECT dataset::Dataset FILTER .uri IN array_unpack(release.datasetUris)),


    cases := (
        SELECT dataset::DatasetCase { } FILTER .dataset IN datasets
    ),

INSERT job::SelectJob {
    forRelease := release,
    status := job::JobStatus.running,
    started := datetime_current(),
    percentDone := 0,
    messages := ["Created"],
    initialTodoCount := count(cases),
    todoQueue := cases,
    selectedSpecimens := {},
    auditEntry := auditEntry
}
